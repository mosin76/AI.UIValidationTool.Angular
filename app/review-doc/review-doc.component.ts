import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocClassification, DocClassificationChangeSaveInfo, DocLabel, DocumentInfo, DocumentInfoResponse, ReviewDocService } from './review-doc.service';
import { Observable, OperatorFunction, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UtilsService, CurrentTenant } from '../shared/utils.service';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { ProgressBarEvent } from 'ngx-extended-pdf-viewer';
import { AuthService } from '@abp/ng.core';
import { Response } from '../shared/utils.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';


@Component({
    selector: 'app-review-doc',
    templateUrl: './review-doc.component.html',
    styleUrls: ['./review-doc.component.scss'],
})

export class ReviewDocComponent extends AutoSquaredBaseComponent {
    loading: boolean = false;
    saving: boolean = false;
    searchLabelSelectionModel: {};
    canSave = false;
    proposedLabels: string;
    showCustomLabelInput: boolean;
    labels: DocLabel[];
    availableLabels: DocLabel[];
    currentDocument: DocumentInfo;
    totalCount: number;
    skippedDocumentIds: number[] = [];
    downloadUrl: string = null;
    pdfDownloadProgress: number = 0;
    groupId: number;
    fileLoadingError: string;

    @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;

    focus$ = new Subject<string>();
    click$ = new Subject<string>();

    constructor(
        private route: ActivatedRoute,
        private reviewService: ReviewDocService,
        private toastr: ToastrService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private confirmDialogService: ConfirmationDialogService,
        private cdr: ChangeDetectorRef) {
        super(utils, auth, router);
    }

    ngOnInit() {
        this.init();
        this.route.queryParams.subscribe(params => {
            this.groupId = params['groupId'];

            this.getLabels();
            if (this.utils.pageTrackingData == 1) {
                this.getNextDocument(null);
                this.utils.pageTrackingData = this.utils.pageTrackingData + 1
            }
        });
    }


    searchBoxformatter = (result: DocLabel) => {
        return `${result.name}`;
    };

    searchOld: OperatorFunction<string, DocLabel[]> = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map((term) =>
                term === '' ? [] : this.labels.filter(v => v.name.toLowerCase().includes(term.toLowerCase())).slice(0, 10),
            ),
        );

    search: OperatorFunction<string, DocLabel[]> = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.typeaheadInstance.isPopupOpen()));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map((term) =>
                (term === '' ? this.availableLabels : this.availableLabels.filter((v) => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1)),
            ))
    }

    pdfLoadProgressCallback(progressData: ProgressBarEvent) {
        //console.log('PDF progress data:', progressData);
        this.pdfDownloadProgress = progressData.percent;
    }

    imageLoadFailed(error: Event) {
        console.error('Image load failed:', error, ' URL', this.downloadUrl);
        this.fileLoadingError = error.toString();
        this.currentDocument.type = 'E';
    }

    pdfLoadFailed(error: Error) {
        console.error('PDF load failed:', error, ' URL', this.downloadUrl);
        this.fileLoadingError = error.message;
        this.currentDocument.type = 'E';
    }

    handleDocumentResponse(response: Response<DocumentInfoResponse>) {
        if (response.success === false) {
            this.toastr.error(response.message);
            console.log(response.message);
            return;
        }

        if (response.data === null || response.data.currentDocument === null) {
            this.currentDocument = null;
            this.totalCount = 0;
            this.downloadUrl = null;
        }
        else {
            this.currentDocument = response.data.currentDocument;
            this.downloadUrl = this.reviewService.getDownloadUrl(this.currentDocument.id);

            this.totalCount = response.data.numberOfDocuments;
            this.currentDocument.classifications.forEach(u => {
                u.userReviewState = 0;
            });
            if (this.labels != null) {
                this.availableLabels = this.labels.filter(x => !this.currentDocument.classifications.some(y => y.labelId == x.id));
            }
            this.canSave = this.currentDocument.classifications.every(x => x.userReviewState !== 0);
        }
        this.searchLabelSelectionModel = { name: '' };
        this.proposedLabels = '';
    }

    getDocumentById(docId: number | null) {
        this.loading = true;
        var tenantId: string = this.isTenantUser ? null : this.tenant.id;

        this.reviewService.getDocumentInfo(tenantId, docId).subscribe(data => {
            this.handleDocumentResponse(data);
            this.loading = false;
        });
    }

    getNextDocument(skipDocId: number | null) {
        this.loading = true;
        var tenantId: string = this.isTenantUser ? null : this.tenant.id;
        var currentDocId: number = this.currentDocument == null ? -1 : this.currentDocument.id;

        this.reviewService.getNextDocumentInfo(tenantId, this.groupId, currentDocId).subscribe(data => {
            this.handleDocumentResponse(data);
            this.loading = false;
        });
    }

    getLabelHelpText(labelId) {
        if (this.labels === null)
            return null;

        return this.labels.find(x => x.id === labelId)?.helpText;
    }

    canSkip() {
        if (this.currentDocument == null)
            return;

        //cant skip if you are the last document
        return (this.totalCount - this.skippedDocumentIds.length) > 1;
    }

    canMovePrevious() {
        return this.skippedDocumentIds.length > 0;
    }

    previous() {
        if (this.skippedDocumentIds.length == 0) {
            return;
        }

        var prevDocId = this.skippedDocumentIds.pop();
        this.getDocumentById(prevDocId);
    }

    skip() {
        this.skippedDocumentIds.push(this.currentDocument.id);
        //this.skippedDocumentId.sort();

        this.getNextDocument(this.currentDocument.id);
    }

    saveUpdateReview() {
        this.saving = true;
        const saveData = this.getUpdateSaveInfo();

        this.reviewService.saveValidation(saveData).subscribe(data => {
            this.saving = false;
            if (!data.success) {
                this.toastr.error(data.message);
                console.log(data.message);
                return;
            }

            this.toastr.success(data.message);

            //if anything skipped, give option to the user to move to next skipped document
            var isLast = this.totalCount - this.skippedDocumentIds.length === 1;

            if (!isLast) {
                if (this.skippedDocumentIds.length > 0) {
                    var lastSkipperDocId = this.skippedDocumentIds[this.skippedDocumentIds.length - 1];
                    this.getNextDocument(lastSkipperDocId);
                } else {
                    //get next document
                    this.getNextDocument(null);
                }
                return;
            } else {
                if (this.skippedDocumentIds.length > 0) {
                    this.confirmDialogService.confirm('Review', 'You just saved the last one on this case. Do you want to move to skipped document?', 'Yes', 'No')
                        .then((confirmed) => {
                            if (confirmed) 
                                this.previous();
                            else
                                this.router.navigate(['/doc-groups']);
                        })
                        .catch(() => this.router.navigate(['/doc-groups']));
                    } else {
                        this.router.navigate(['/doc-groups']);
                    }
            }                         
        }).add(() => {
            this.saving = false;
        });
    }

    approve(docLabelId: number) {
        const classification = this.currentDocument.classifications.find(x => x.labelId === docLabelId);
        if (classification) {
            classification.userReviewState = 1;
            this.canSave = this.currentDocument.classifications.every(x => x.userReviewState !== 0);
        }
    }

    reject(docLabelId: number) {
        const classification = this.currentDocument.classifications.find(x => x.labelId === docLabelId);
        if (classification) {
            classification.userReviewState = -1;
            this.canSave = this.currentDocument.classifications.every(x => x.userReviewState !== 0);
        }
    }


    getUpdateSaveInfo(): DocClassificationChangeSaveInfo {
        const approvedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === 1).map(x => x.id);
        const rejectedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === -1).map(x => x.id);
        const userChosenLabelIds = this.currentDocument.userChosenLabelIds;

        return {
            documentId: this.currentDocument.id,
            approvedAIDocLabelIds,
            rejectedAIDocLabelIds,
            userChosenLabelIds,
            proposedLabels: this.proposedLabels
        };
    }

    getLabelName(labelId) {
        let labelIndex = this.labels.findIndex(x => x.id === labelId);
        return this.labels[labelIndex]?.name || '';
    }

    getLabels() {
        this.reviewService.getLabels().subscribe(data => {
            this.labels = data;
            if (this.currentDocument != null) {
                //TODO: this.currentDocument.classifications.forEach(u => u.helpText = this.labels.find(l => l.id == u.labelId).helpText);
                this.availableLabels = this.labels.filter(x => !this.currentDocument.classifications.some(y => y.labelId == x.id));
            }
        });
    }

    addLabel(event: NgbTypeaheadSelectItemEvent) {
        var labelId = event.item.id;
        var update = this.currentDocument;
        update.userChosenLabelIds = update.userChosenLabelIds || [];
        if (!update.userChosenLabelIds.includes(labelId) && update.classifications.findIndex(c => c.labelId == labelId) == -1) {
            update.userChosenLabelIds.push(labelId);
            this.availableLabels = this.labels.filter(x => !update.userChosenLabelIds.some(y => y == x.id));
        }

        this.searchLabelSelectionModel = { name: '' };
        this.cdr.detectChanges();  // Trigger change detection
    }
    deleteLabel(labelId: number) {
        var update = this.currentDocument;
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

    updateDirtyLabels() {
        this.currentDocument.userChosenLabelIds = this.currentDocument.userChosenLabelIds || [];
        return this.currentDocument.userChosenLabelIds;
    }

    ngOnDestroy(): void {
        this.reviewService
            .userReviewDone()
            .subscribe(
                error => {
                    console.log(error);
                    //this.toastr.error('An error occurred while userReviewDone');
                });
        if (!this.router.url.includes('/review-doc'))
            this.utils.pageTrackingData = 1;
    }
}


