import { Component, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Observable, OperatorFunction, merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { UtilsService } from '../shared/utils.service';
import { ReviewUpdatesApiService, ReviewChangeSaveInfo, UpdateChangeSaveInfo, LabelNode } from '../shared/review-updates-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@abp/ng.core';

@Component({
    selector: 'app-validation',
    templateUrl: './review-updates.component.html',
    styleUrls: ['./review-updates.component.scss'],
})
export class ReviewUpdatesComponent extends AutoSquaredBaseComponent implements OnDestroy {
    data: UpdatesPaginated;
    labels: ClassificationLabel[];
    currentPage = 1;
    totalPages: number;
    pageSize = 10;
    eventTypeId: number;
    saving: boolean = false;
    perPage = 10;
    labelsTree: LabelNode[];


    constructor(private reviewService: ReviewUpdatesApiService,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        router: Router,
        auth: AuthService,
        utils: UtilsService) {
        super(utils, auth, router);
    }

    @ViewChildren(NgbTypeahead) typeaheadInstances: QueryList<NgbTypeahead>;
    @ViewChild('typeaheadInstance', { static: false }) inputElement: ElementRef

    focus$ = new Subject<{ update: Update, value: string }>();
    click$ = new Subject<{ update: Update, value: string }>();
    /*
         Formats the label for display in the typeahead dropdown.
         @param result - The label to format.
         @returns The formatted label string.
        */
    searchBoxformatter = (result: ClassificationLabel) => {
        return `${result.fullName}`;
    };
    //Blurs and refocuses the input element to ensure proper behavior.
    blurInput() {
        if (this.inputElement) {
            this.inputElement.nativeElement.blur();
            this.inputElement.nativeElement.focus();
        }
    }

    /*
      Creates an operator function for searching labels.
      @returns An operator function for filtering labels based on user input.
      */
    search1(): OperatorFunction<string, ClassificationLabel[]> {
        return (text$: Observable<string>) =>
            text$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                map((term) =>
                    term === '' ? [] : this.labels.filter(v => v.fullName.toLowerCase().includes(term.toLowerCase())),
                ),
            );
    }
    /*
      Creates an operator function for searching labels with focus and click handling.
      @param update - The update context for filtering labels.
      @returns An operator function for filtering labels based on user input and interactions.
     */
    search(update: Update): OperatorFunction<string, ClassificationLabel[]> {
        return (text$: Observable<string>) => {
            return merge(
                text$.pipe(
                    debounceTime(20),
                    distinctUntilChanged()
                ),
                this.focus$.pipe(
                    filter(focus => focus.update === update),
                    map(focus => focus.value)
                ),
                this.click$.pipe(
                    filter(click => click.update === update),
                    map(click => click.value)
                )
            ).pipe(
                switchMap(term => {
                    const searchTerm = typeof term === 'string' ? term : '';
                    const filteredLabels = searchTerm === ''
                        ? update.availableLabels
                        : update.availableLabels.filter(v => v.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
                    console.log('Filtered Labels:', filteredLabels);
                    return [filteredLabels.slice(0, 10)];
                })
            );

        };
    }

    /*
       Handles selection of a label from the menu and updates the current update.
       @param label - The selected label.
       @param update - The update to be updated with the selected label.
      */
    menuLabelSelected(label: LabelNode, update: Update) {
        if (label) {
            var labelId = label.id;
            update.userChosenLabelIds = update.userChosenLabelIds || [];
            if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c => c.classificationLabelId == labelId) == -1) {
                update.userChosenLabelIds.push(labelId);
            }

            update.searchLabelSelectionModel = { fullName: '' };
            this.cdr.detectChanges();  // Trigger change detection            
        }
    }
    /*
      Retrieves the help text for a label based on its ID.
      @param labelId - The ID of the label.
      @returns The help text of the label.
      */
    getLabelHelpText(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.helpText;
    }
    /*
      Retrieves the full name of a label based on its ID.
      @param labelId - The ID of the label.
      @returns The full name of the label.
     */
    getLabelHelpTitle(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.fullName;
    }

    // Initializes the component, including fetching data and setting up routes.
    ngOnInit() {
        this.init();

        this.route.queryParams.subscribe(params => {
            this.eventTypeId = params['eventTypeId'];

            this.getLabels();
            this.getValidationData();
        });
    }
    //  Fetches the list of updates from the server and formats the data for display.
    getValidationData() {
        this.loading = true;
        this.reviewService.getUpdateList(this.eventTypeId, this.currentPage, this.perPage, this.tenant.id).subscribe(data => {
            this.formatUpdatesData(data);
            this.loading = false;
        });
    }
    /*
       Formats the updates data for display, including available labels and custom label input visibility.
       @param data - The paginated updates data.
         */
    formatUpdatesData(data: UpdatesPaginated) {
        this.data = data;
        this.currentPage = this.data.pageIndex;
        this.totalPages = Math.ceil(this.data.totalCount / this.perPage);

        if (this.labels && this.data.items) {
            this.data.items.forEach(update => {
                update.availableLabels = this.labels.filter(label => !update.classifications.some(x => x.classificationLabelId === label.id));
                update.showCustomLabelInput = false;
            });
        }
    }
    //   Fetches the list of classification labels and labels tree from the server.
    getLabels() {
        this.reviewService.getClassificationLabelsTree().subscribe(data => {
            this.labelsTree = data;
        });

        this.reviewService.getClassificationLabels().subscribe(labelData => {
            this.labels = labelData;

            if (this.labels && this.data && this.data.items) {
                this.data.items.forEach(update => {
                    update.availableLabels = this.labels.filter(label => !update.classifications.some(x => x.classificationLabelId === label.id));
                    update.showCustomLabelInput = false;
                });
            }
        });
    }
    /*
       Ensures that the list of user-chosen label IDs is initialized if it is null or undefined.
       @param update - The update to be checked and updated.
       @returns The list of user-chosen label IDs.
        */
    updateDirtyLabels(update: Update) {
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        return update.userChosenLabelIds;
    }
    /*
      Removes a label from the list of user-chosen labels for the current update.
      @param update - The update from which the label will be removed.
      @param labelId - The ID of the label to be removed.
         */
    deleteLabel(update: Update, labelId: number) {
        var labelIndex = update.userChosenLabelIds.indexOf(labelId);
        update.userChosenLabelIds.splice(labelIndex, 1);
    }
    /*
      Adds a label to the list of user-chosen labels for the current update based on typeahead selection.
      @param event - The typeahead selection event containing the selected label.
      @param update - The update to be updated with the selected label.
         */
    addLabel(event: NgbTypeaheadSelectItemEvent, update: Update) {
        var labelId = event.item.id;
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c => c.classificationLabelId == labelId) == -1) {
            update.userChosenLabelIds.push(labelId);
        }

        update.searchLabelSelectionModel = { fullName: '' };
        this.cdr.detectChanges();  // Trigger change detection
    }
    /*
         Creates an object containing information about the changes made to an update.
         @param update - The update with changes.
         @returns An object with information about the changes for saving.
         */
    getUpdateSaveInfo(update: Update): UpdateChangeSaveInfo {
        let approvedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === 1).map(x => x.id);
        let rejectedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === -1).map(x => x.id);
        let userChosenLabelIds = update.userChosenLabelIds;
        let proposedLabels = update.proposedLabels;
        return { updateId: update.id, approvedAIUpdateLabelIds, rejectedAIUpdateLabelIds, userChosenLabelIds, proposedLabels };
    }
    /*
       Saves the review changes for an update to the server.
       @param item - The update with review changes to be saved.
        */
    saveUpdateReview(item: Update) {
        item.saving = true;
        var saveData: ReviewChangeSaveInfo = { eventTypeId: this.eventTypeId, tenantId: this.tenant.id, changes: [this.getUpdateSaveInfo(item)] };

        this.reviewService
            .saveUpdateReview(saveData)
            .subscribe(data => {
                if (data.success) {
                    this.toastr.success(data.message);
                    var deletedItemIndex = this.data.items.findIndex(x => x.id === item.id);
                    this.data.items.splice(deletedItemIndex, 1);

                    this.data.totalCount = data.numberOfUpdates;

                    if (this.data.items.length == 0)
                        this.getValidationData();
                }
                else
                    this.toastr.error(data.message);
            }, error => {
                console.log(error);
                this.toastr.error('An error occurred while saving the data');
            }).add(() => {
                item.saving = false;
            });
    }
    /*
        Approves a classification label for an update.
        @param update - The update containing the classification.
        @param updateClassificationId - The ID of the classification to be approved.
         */
    approve(update: Update, updateClassificationId: number) {
        var updateClassification = update.classifications.find(x => x.id === updateClassificationId)
        updateClassification.userReviewState = 1;
        update.canSave = update.classifications.every(x => x.userReviewState !== undefined && x.userReviewState !== 0);
    }
    /*
      Rejects a classification label for an update.
      @param update - The update containing the classification.
      @param updateClassificationId - The ID of the classification to be rejected.
      */
    reject(update: Update, updateClassificationId: number) {
        var updateClassification = update.classifications.find(x => x.id === updateClassificationId)
        updateClassification.userReviewState = -1;
        update.canSave = update.classifications.every(x => x.userReviewState !== undefined && x.userReviewState !== 0);
    }
    /*
       Retrieves the full name of a label based on its ID.
       @param labelId - The ID of the label.
       @returns The full name of the label.
       */
    getLabelName(labelId) {
        let labelIndex = this.labels.findIndex(x => x.id === labelId);
        return this.labels[labelIndex]?.fullName || '';
    }
    /*
     Toggles the visibility of the custom label input for an update.
     @param item - The update to toggle the custom label input for.
     */
    openCustomLabelPopup(item: Update) {
        item.showCustomLabelInput = !item.showCustomLabelInput;
    }
    /*
      Saves the custom label input for an update and hides the input field.
      @param item - The update with the custom label input.
      */
    saveCustomLabel(item: Update) {
        item.showCustomLabelInput = false;
    }
    // Handles cleanup tasks when the component is destroyed.
    ngOnDestroy(): void {
        this.reviewService
            .userUpdatesReviewDone()
            .subscribe(
                error => {
                    console.log(error);
                });
    }
}

export interface UpdatesPaginated {
    title: String;
    items: Update[];
    totalCount: number;
    pageIndex: number;
}

export class Update {
    id: number;
    caseId: number;
    timestamp: Date;
    postedBy: String;
    update: String;
    classifications: UpdateClassificationLabel[];
    searchLabelSelectionModel: {};
    availableLabels: ClassificationLabel[];//available labels which are not already added
    userChosenLabelIds: number[]
    canSave = false;
    proposedLabels: string;
    showCustomLabelInput: boolean;
    saving: boolean;
}

export class UpdateClassificationLabel {

    constructor() {
        this.userReviewState = 0;
    }

    id: number;
    probability: number;
    classificationLabelId: number;
    userChosen: Boolean;
    fullName: String;
    isDirty: Boolean;
    userReviewState: number = 0; //0: not reviewed, 1: approved, -1: rejected
}

export interface ClassificationLabel {
    id: number;
    name: String;
    fullName: String;
    helpText: string;
}
