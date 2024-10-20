import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild,AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, merge, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from '../shared/utils.service'; 
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { Router } from '@angular/router'; 
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ReviewChangeSaveInfo, LabelNode, ReviewUpdatesApiService, UpdateChangeSaveInfo } from '../shared/review-updates-api.service'; 
import { AuthService } from '@abp/ng.core';


@Component({
    selector: 'app-review-update',
    templateUrl: './review-update.component.html',
    styleUrls: ['./review-update.component.scss'],
})
export class ReviewUpdateComponent extends AutoSquaredBaseComponent implements OnInit, AfterViewInit, OnDestroy {
    currentUpdate: Update;
    eventTypeId: number;
    labels: ClassificationLabel[];
    eventType: string;
    numberOfUpdates: number;
    searchLabelSelectionModel: {};
    canSave = false;
    proposedLabels: string;
    showCustomLabelInput: boolean;
    availableLabels: ClassificationLabel[];

    labelsTree : LabelNode[];

    @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;
    focus$ = new Subject<string>();
    click$ = new Subject<string>();



    constructor(
        private route: ActivatedRoute,
        private reviewService: ReviewUpdatesApiService,
        private toastr: ToastrService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private cdr: ChangeDetectorRef) {
        super(utils,auth, router);
    }

    ngOnInit() {
        this.init();
        alert("mohsin")
        this.route.queryParams.subscribe(params => {
            this.eventTypeId = params['eventTypeId'];
        
            this.getLabels();

            this.getNextUpdate();
        });
    }

    ngAfterViewInit(): void {
        // Access the typeaheadInstance here, where it should be defined
        console.log(this.typeaheadInstance);
    }

    searchBoxformatter = (result: ClassificationLabel) => {
        return `${result.fullName}`;
    };

    search1: OperatorFunction<string, ClassificationLabel[]> = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map((term) =>
                term === '' ? [] : this.availableLabels.filter(v => v.fullName.toLowerCase().includes(term.toLowerCase())).slice(0, 10),
            ),
        );

    search: OperatorFunction<string, ClassificationLabel[]> = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.typeaheadInstance.isPopupOpen()));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map((term) =>
                (term === '' ? this.availableLabels : this.availableLabels.filter((v) => v.fullName.toLowerCase().indexOf(term.toLowerCase()) > -1)),
            ))
    }    

    getLabelHelpText(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.helpText;
    }

    getLabelHelpTitle(labelId: number) {
        return this.labels.find(x => x.id === labelId)?.fullName;
    }

    getNextUpdate() {
        this.loading = true;
        var tenantId: string = this.isTenantUser ? null : this.tenant.id;
        this.reviewService.getUpdateList(this.eventTypeId, 0, 1, tenantId).subscribe(data => {
            if (data.items === null || data.items.length == 0)
                this.currentUpdate = null;
            else {
                this.currentUpdate = data.items[0];
                this.currentUpdate.classifications.forEach(u => u.userReviewState = 0);
                this.canSave = this.currentUpdate.classifications.every(x => x.userReviewState !== 0);
                if(this.labels != null)
                    this.availableLabels = this.labels.filter(x => !this.currentUpdate.classifications.some(y => y.classificationLabelId == x.id));
            }
            this.eventType = data.title;
            this.numberOfUpdates = data.totalCount;
            this.searchLabelSelectionModel = { fullName: '' };
            this.loading = false;
        });
    }

    saveUpdateReview(update: Update) {
        this.saving = true;
        this.loading = true;
        var saveData:ReviewChangeSaveInfo = { eventTypeId: this.eventTypeId, tenantId: this.tenant.id, changes: [this.getUpdateSaveInfo(update)] };

        this.reviewService.saveUpdateReview(saveData).subscribe(data => {
            if (data.success) {
                this.toastr.success(data.message);
                this.getNextUpdate();
            } else {
                this.toastr.error(data.message);
                console.log(data.message);
            }
        }).add(() => {
            this.saving = false;
        });
    }

    approve(update: Update, updateClassificationId: number) {
        const classification = update.classifications.find(x => x.id === updateClassificationId);
        if (classification) {
            classification.userReviewState = 1;
            this.canSave = update.classifications.every(x => x.userReviewState !== 0);
        }
    }

    reject(update: Update, updateClassificationId: number) {
        const classification = update.classifications.find(x => x.id === updateClassificationId);
        if (classification) {
            classification.userReviewState = -1;
            this.canSave = update.classifications.every(x => x.userReviewState !== 0);
        }
    }

    getUpdateSaveInfo(update: Update): UpdateChangeSaveInfo {
        const approvedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === 1).map(x => x.id);
        const rejectedAIUpdateLabelIds = update.classifications.filter(x => x.userReviewState === -1).map(x => x.id);
        const userChosenLabelIds = update.userChosenLabelIds;

        return {
            updateId: update.id,
            approvedAIUpdateLabelIds,
            rejectedAIUpdateLabelIds,
            userChosenLabelIds,
            proposedLabels: this.proposedLabels
        };
    }

    getLabelName(labelId) {
        let labelIndex = this.labels.findIndex(x => x.id === labelId);
        return this.labels[labelIndex]?.fullName || '';
    }

    getLabels() {
        this.reviewService.getClassificationLabelsTree().subscribe(data => {
            this.labelsTree = data;
        });
        this.reviewService.getClassificationLabels().subscribe(data => {
            this.labels = data;
            if (this.currentUpdate != null)
                this.availableLabels = this.labels.filter(x => !this.currentUpdate.classifications.some(y => y.classificationLabelId == x.id));
        });
    }

    addLabel(event: NgbTypeaheadSelectItemEvent, update: Update) {
        var labelId = event.item.id;
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c => c.classificationLabelId == labelId) == -1) {
            update.userChosenLabelIds.push(labelId);
            this.availableLabels = this.labels.filter(x => !update.userChosenLabelIds.some(y => y == x.id));
        }

        this.searchLabelSelectionModel = { fullName: '' };
        this.cdr.detectChanges();  // Trigger change detection
    }
    deleteLabel(update: Update, labelId: number) {
        var labelIndex = update.userChosenLabelIds.indexOf(labelId);
        update.userChosenLabelIds.splice(labelIndex, 1);
        this.availableLabels = this.labels.filter(x => !update.userChosenLabelIds.some(y => y == x.id));
    }

    openCustomLabelPopup() {
        this.showCustomLabelInput = !this.showCustomLabelInput;
    }

    saveCustomLabel() {
        this.showCustomLabelInput = false;
    }

    updateDirtyLabels(update: Update) {
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        return update.userChosenLabelIds;
    }

    ngOnDestroy(): void {
        this.reviewService
            .userUpdatesReviewDone()
            .subscribe(
                error => {
                    console.log(error);
                });
    }

        labelClicked(label: LabelNode) {
        var labelId = label.id;
        var update = this.currentUpdate;
        this.currentUpdate.userChosenLabelIds = this.currentUpdate.userChosenLabelIds || [];
        if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c => c.classificationLabelId == labelId) == -1) {
            update.userChosenLabelIds.push(labelId);
            this.availableLabels = this.labels.filter(x => !update.userChosenLabelIds.some(y => y == x.id));
        }
    }
}



export class Update {
    id: number;
    caseId: number;
    timestamp: Date;
    postedBy: String;
    update: String;
    classifications: UpdateClassificationLabel[];
    availableLabels: ClassificationLabel[];//available labels which are not already added
    userChosenLabelIds: number[]
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
