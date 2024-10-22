import { Component, ChangeDetectorRef,ViewChild, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {  DocClassificationChangeSaveInfo, DocLabel, DocumentInfo, DocumentInfoResponse, ReviewDocService } from './review-doc.service';
import { Observable, OperatorFunction, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UtilsService,Response} from '../shared/utils.service';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { ProgressBarEvent } from 'ngx-extended-pdf-viewer';
import { AuthService } from '@abp/ng.core';
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
    downloadUrl: string | null = null;
    pdfDownloadProgress: number = 0;
    groupId: number;
    fileLoadingError: string;
   
    @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;

    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    currentUpdate: any;
   
    constructor(
        private route: ActivatedRoute,
        private reviewService: ReviewDocService,
        private toastr: ToastrService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private confirmDialogService: ConfirmationDialogService,
        private cdr: ChangeDetectorRef
    ) {
        super(utils, auth, router);
    }

    ngOnInit() {
        this.init();
        this.route.queryParams.subscribe(params => {
            this.groupId = params['groupId'];
            var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
            this.getLabels(tenantId);
            if (this.utils.pageTrackingData == 1) {
                this.getNextDocument(null);
                this.utils.pageTrackingData = this.utils.pageTrackingData + 1;
            }
        });
    }
 
// Formatter for the search box, displaying the label name.
    searchBoxformatter = (result: DocLabel) => {
        return `${result.name}`;
    };
     /*
      Old search function for labels using a typeahead component.
      Filters labels based on user input with debouncing.
      We are not calling this function anywhere.
     */
    searchOld: OperatorFunction<string, DocLabel[]> = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map((term) =>
                term === '' ? [] : this.labels.filter(v => v.name.toLowerCase().includes(term.toLowerCase())).slice(0, 10),
            ),
        );
    /*
     New search function for labels using a typeahead component.
     Merges debounced user input with click and focus events for better search experience.
     */
    search: OperatorFunction<string, DocLabel[]> = (text$: Observable<string>) => {
        const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
        const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.typeaheadInstance.isPopupOpen()));
        const inputFocus$ = this.focus$;

        return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
            map((term) =>
                (term === '' ? this.availableLabels : this.availableLabels.filter((v) => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1)),
            ))
    }
//Callback function to track PDF loading progress.
    pdfLoadProgressCallback(progressData: ProgressBarEvent) {

        this.pdfDownloadProgress = progressData.percent;
    }
// Handles errors when an image fails to load.
    imageLoadFailed(error: Event) {
        console.error('Image load failed:', error, ' URL', this.downloadUrl);
        this.fileLoadingError = error.toString();
        this.currentDocument.type = 'E';
    }
//Handles errors when a PDF fails to load.
    pdfLoadFailed(error: Error) {
        console.error('PDF load failed:', error, ' URL', this.downloadUrl);
        this.fileLoadingError = error.message;
        this.currentDocument.type = 'E';
    }
//Handles the document response, updating the current document, available labels, and save state.
    handleDocumentResponse(response: Response<DocumentInfoResponse>) {
        if (response.success === false) {
            this.toastr.error(response.message);
            console.log(response.message);
            return;
        }

        if (response.data === null || response.data.currentDocument === null) {
            this.totalCount = 0;
            this.downloadUrl = null;
            
        }
        else {
            var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;

            this.currentDocument = response.data.currentDocument;
            this.downloadUrl = this.reviewService.getDownloadUrl(tenantId, this.currentDocument.id);
              
            this.totalCount = response.data.numberOfDocuments;
            console.log (this.totalCount);
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
//Retrieves a document by its ID and updates the current document state.
    getDocumentById(docId: number | null) {
        this.loading = true;
        var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
        var caseId=this.groupId;
        this.reviewService.getDocumentInfo(tenantId, docId,caseId).subscribe(data => {
            this.handleDocumentResponse(data);
            this.loading = false;
        });
    }
//Retrieves the next document to review, optionally skipping a document.
    getNextDocument(skipDocId: number | null) {
        this.loading = true;
        var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
        var currentDocId: number = this.currentDocument == null ? -1 : this.currentDocument.id;
        this.reviewService.getNextDocumentInfo(tenantId, this.groupId, currentDocId).subscribe(data => {
            this.handleDocumentResponse(data);
            this.loading = false;
        });
    }
// Retrieves the help text for a specific label by its ID.
    getLabelHelpText(labelId) {
        if (this.labels === null)
            return null;

        return this.labels.find(x => x.id === labelId)?.helpText;
    }
// Determines whether the current document can be skipped.
    canSkip() {
        if (this.currentDocument == null)
            return;

        //can't skip if you are the last document
        return (this.totalCount - this.skippedDocumentIds.length) > 1;
    }
// Determines whether the user can move to the previous document.

    canMovePrevious() {
        return this.skippedDocumentIds.length > 0;
    }
//Moves to the previous skipped document.
previous() {
    if (this.skippedDocumentIds.length === 0) {
        return;
    }
  
    const prevDocId = this.skippedDocumentIds.pop();
    
    // Check if prevDocId is defined
    if (prevDocId !== undefined) {
        this.getDocumentById(prevDocId);
    } else {
        console.warn("No previous document ID found."); // Optional: log a warning if needed
    }
}

// Skips the current document and moves to the next one.
    skip() {
        
        this.skippedDocumentIds.push(this.currentDocument.id);

        this.getNextDocument(this.currentDocument.id);
    }
// Saves the review of the current document and handles the post-save logic.
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
            const isLast = this.totalCount - this.skippedDocumentIds.length === 1;

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
// This function is approving the predicted labels.
    approve(docLabelId: number) {
        const classification = this.currentDocument.classifications.find(x => x.labelId === docLabelId);
        if (classification) {
            classification.userReviewState = 1;
            this.canSave = this.currentDocument.classifications.every(x => x.userReviewState !== 0);
        }
    }
// This function is rejected the predicted labels.
    reject(docLabelId: number) {
        const classification = this.currentDocument.classifications.find(x => x.labelId === docLabelId);
        if (classification) {
            classification.userReviewState = -1;
            this.canSave = this.currentDocument.classifications.every(x => x.userReviewState !== 0);
        }
    }

// Prepares the document's review state information for saving.
    getUpdateSaveInfo(): DocClassificationChangeSaveInfo {
        const approvedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === 1).map(x => x.labelId);
        const rejectedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === -1).map(x => x.labelId);
        const userChosenLabelIds = this.currentDocument.userChosenLabelIds;

        return {
            documentId: this.currentDocument.id,
            approvedAIDocLabelIds,
            rejectedAIDocLabelIds,
            userChosenLabelIds,
            proposedLabels: this.proposedLabels,
            tenantId:this.tenant.id,
            caseId:this.groupId
        };
    }
// Retrieves available label name from the service.
    getLabelName(labelId) {
        let labelIndex = this.labels.findIndex(x => x.id === labelId);
        return this.labels[labelIndex]?.name || '';
    }
//  Retrieves available labels from the service
getLabels(tenantId) {

    this.reviewService.getLabels(tenantId).subscribe(data => {
            this.labels = data;
            if (this.currentDocument != null) {
                this.availableLabels = this.labels.filter(x => !this.currentDocument.classifications.some(y => y.labelId == x.id));
            }
        });
    }
//   Adds a new label to the current document's classifications.
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
    // Delete a new label to the current document's classifications.
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
        // this.reviewService
        //     .userReviewDone()
        //     .subscribe(
        //         error => {
        //             console.log(error)
        //         });
        // if (!this.router.url.includes('/review-doc'))
        //     this.utils.pageTrackingData = 1;
    }
    
}


