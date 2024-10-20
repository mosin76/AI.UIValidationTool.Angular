import { Component, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef,ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router  } from '@angular/router';
import { Observable, OperatorFunction, merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent,NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { UtilsService } from '../shared/utils.service'; 
 
import { ReviewUpdatesApiService, ReviewChangeSaveInfo, UpdateChangeSaveInfo, LabelNode } from '../shared/review-updates-api.service';
import { AuthService } from '@abp/ng.core';

@Component({
    selector: 'app-validation',
    templateUrl: './review-updates.component.html',
    styleUrls: ['./review-updates.component.scss'],
})
export class ReviewUpdatesComponent extends AutoSquaredBaseComponent implements  OnDestroy{
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
        utils: UtilsService)
    {
        super(utils,auth, router);
    }

    @ViewChildren(NgbTypeahead) typeaheadInstances: QueryList<NgbTypeahead>;
    @ViewChild('typeaheadInstance', { static: false }) inputElement: ElementRef

   focus$ = new Subject<{ update: Update, value: string }>();
    click$ = new Subject<{ update: Update, value: string }>();

    searchBoxformatter = (result: ClassificationLabel) => {
        return `${result.fullName}`;
    };

    blurInput() {
        if (this.inputElement) {
          this.inputElement.nativeElement.blur();
          this.inputElement.nativeElement.focus();
        }
    }


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

    getLabelHelpText(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.helpText;
    }

    getLabelHelpTitle(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.fullName;
    }

    ngOnInit() {
        this.init();

        this.route.queryParams.subscribe(params => {
            this.eventTypeId = params['eventTypeId'];

            this.getLabels();
            this.getValidationData();
        });
    }

    getValidationData() {
        this.loading = true;
        this.reviewService.getUpdateList(this.eventTypeId, this.currentPage, this.perPage, this.tenant.id).subscribe(data => {
            this.formatUpdatesData(data);
            this.loading = false;
        });
    }

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

    updateDirtyLabels(update: Update) {
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        return update.userChosenLabelIds;
    }

    deleteLabel(update: Update, labelId: number) {
        var labelIndex = update.userChosenLabelIds.indexOf(labelId);
        update.userChosenLabelIds.splice(labelIndex, 1);
    }

    addLabel(event: NgbTypeaheadSelectItemEvent, update: Update) {
        var labelId = event.item.id;
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c =>  c.classificationLabelId == labelId) == -1 ) {
            update.userChosenLabelIds.push(labelId);
        }

        update.searchLabelSelectionModel = { fullName: '' };
        this.cdr.detectChanges();  // Trigger change detection
    }

    getUpdateSaveInfo(update:Update): UpdateChangeSaveInfo {
        let approvedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === 1).map(x => x.id);
        let rejectedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === -1).map(x => x.id);
        let userChosenLabelIds = update.userChosenLabelIds;
        let proposedLabels = update.proposedLabels;
        return { updateId: update.id, approvedAIUpdateLabelIds, rejectedAIUpdateLabelIds, userChosenLabelIds, proposedLabels };
    }

    saveUpdateReview(item: Update) {
        item.saving = true;
        var saveData: ReviewChangeSaveInfo = { eventTypeId: this.eventTypeId, tenantId : this.tenant.id, changes: [this.getUpdateSaveInfo(item)] };

        this.reviewService
            .saveUpdateReview(saveData)
            .subscribe(data => {
                if (data.success) {
                    this.toastr.success(data.message);
                    var deletedItemIndex = this.data.items.findIndex(x => x.id === item.id);
                    this.data.items.splice(deletedItemIndex, 1);

                    this.data.totalCount = data.numberOfUpdates;

                    if(this.data.items.length == 0)
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

    approve(update:Update,  updateClassificationId: number) {
        var updateClassification = update.classifications.find(x => x.id === updateClassificationId)
        updateClassification.userReviewState = 1;
        update.canSave = update.classifications.every(x => x.userReviewState !== undefined && x.userReviewState !== 0);
    }

    reject(update: Update, updateClassificationId: number) {
        var updateClassification = update.classifications.find(x => x.id === updateClassificationId)
        updateClassification.userReviewState = -1;
        update.canSave = update.classifications.every(x => x.userReviewState !== undefined && x.userReviewState !== 0);
    }


    getLabelName(labelId) {
        let labelIndex = this.labels.findIndex(x => x.id === labelId);
        return this.labels[labelIndex]?.fullName || '';
    }

    openCustomLabelPopup(item: Update) {
        item.showCustomLabelInput = !item.showCustomLabelInput;
    }

    saveCustomLabel(item: Update) {
        item.showCustomLabelInput = false;
    }

    ngOnDestroy(): void {
         this.reviewService
             .userUpdatesReviewDone()
             .subscribe(
                 error => {
                     console.log(error);
                     //this.toastr.error('An error occurred while userReviewDone');
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
