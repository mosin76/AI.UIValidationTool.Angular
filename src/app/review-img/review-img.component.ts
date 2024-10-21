import { Component, ChangeDetectorRef, ViewChild, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, OperatorFunction, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UtilsService, Response } from '../shared/utils.service';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { ProgressBarEvent } from 'ngx-extended-pdf-viewer';
import { AuthService } from '@abp/ng.core';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { DocClassificationChangeSaveInfo, DocLabel, DocumentInfo, DocumentInfoResponse, ReviewImgService } from './review-img.service';

@Component({
    selector: 'app-review-img',
    templateUrl: './review-img.component.html',
    styleUrl: './review-img.component.scss'
})
export class ReviewImgComponent extends AutoSquaredBaseComponent {
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
    zoomLevel: number = 1;
    zoomFactor = 1;  // Initial zoom factor
    borderSize = 2;
    borderColor = '#000000';
    imageTransform: string = '';
    positionX: number = 0;
    positionY: number = 0;
    sliderValue: number = 50;
    verticalSliderValue: number = 50;
    maxPositionX: number = 100;
    maxPositionY: number = 100;
    rotationAngle: number = 0;
    imageWidth: number = 0;
    imageHeight: number = 0

    @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;

    focus$ = new Subject<string>();
    click$ = new Subject<string>();
    currentUpdate: any;
    imageElement: any;
    imageScale: any;

    constructor(
        private route: ActivatedRoute,
        private reviewService: ReviewImgService,
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
            var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;

            this.getLabels(tenantId);
            if (this.utils.pageTrackingData == 1) {
                this.getNextPic(null);
                this.utils.pageTrackingData = this.utils.pageTrackingData + 1;
            }
        });
    }

    ngAfterViewInit() {
        this.updateImageDimensions();
        this.updateTransform();
        this.calculateMaxPositions();
    }

    calculateMaxPositions() {
        if (this.imageElement && this.imageElement.nativeElement) {
            const image = this.imageElement.nativeElement;
            this.maxPositionX = image.width * this.imageScale - image.clientWidth;
            this.maxPositionY = image.height * this.imageScale - image.clientHeight;
            if (this.maxPositionX < 0) this.maxPositionX = 0;
            if (this.maxPositionY < 0) this.maxPositionY = 0;
        }
    }
    updateImageDimensions() {
        const imageElement = document.querySelector('.image-container img') as HTMLImageElement;
        if (imageElement) {
            this.imageWidth = imageElement.naturalWidth * this.zoomLevel / 2;
            this.imageHeight = imageElement.naturalHeight * this.zoomLevel / 2;
            this.maxPositionX = Math.max(this.imageWidth);
            this.maxPositionY = Math.max(this.imageHeight);

            // Update slider max values based on image dimensions
            this.sliderValue = this.calculateSliderValueFromPositionX(this.positionX);
            this.verticalSliderValue = this.calculateSliderValueFromPositionY(this.positionY);
        }
    }
    calculateSliderValueFromPositionX(positionX: number): number {
        return (positionX / this.maxPositionX) * 100 + 50;
    }

    calculateSliderValueFromPositionY(positionY: number): number {
        return (positionY / this.maxPositionY) * 100 + 50;
    }

    onSliderChange(event: any) {
        this.positionX = this.calculatePositionXFromSlider(event.target.value);
        this.updateTransform();
    }

    onVerticalSliderChange(event: any) {
        this.positionY = this.calculatePositionYFromSlider(event.target.value);
        this.updateTransform();
    }

    zoomIn() {
        if (this.zoomLevel < 5) {
            this.zoomLevel += 0.5;
            this.updateImageDimensions();
            this.updateTransform();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 0.5) {
            this.zoomLevel -= 0.5;
            this.updateImageDimensions();
            this.updateTransform();
        }
    }

    rotateLeft() {
        this.rotationAngle -= 30;
        this.updateTransform();
    }

    rotateRight() {
        this.rotationAngle += 30;
        this.updateTransform();
    }

    resetZoomAndRotation() {
        this.zoomLevel = 1;
        this.rotationAngle = 0;
        this.positionX = 0;
        this.positionY = 0;
        this.sliderValue = 50;
        this.verticalSliderValue = 50;
        this.updateImageDimensions();
        this.updateTransform();
    }

    updateTransform() {
        const transform = `scale(${this.zoomLevel}) rotate(${this.rotationAngle}deg) translateX(${this.positionX}px) translateY(${this.positionY}px)`;
        const imageElement = document.querySelector('.image-container img') as HTMLImageElement;
        if (imageElement) {
            imageElement.style.transform = transform;

        }

    }

    calculatePositionXFromSlider(sliderValue: number): number {
        return (sliderValue - 50) / 50 * this.maxPositionX;
    }

    calculatePositionYFromSlider(sliderValue: number): number {
        return (sliderValue - 50) / 50 * this.maxPositionY;
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
            this.currentDocument = response.data.currentDocument;
            var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
            this.downloadUrl = this.reviewService.getDownloadUrl(tenantId, this.currentDocument.id);

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
    //Retrieves a document by its ID and updates the current document state.
    getPicById(docId: number | null) {
        this.loading = true;
        var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;

        this.reviewService.getPicInfo(tenantId, docId).subscribe(data => {
            this.handleDocumentResponse(data);
            this.loading = false;
        });
    }
    //Retrieves the next document to review, optionally skipping a document.
    getNextPic(skipDocId: number | null) {
        this.loading = true;
        var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
        var currentDocId: number = this.currentDocument == null ? -1 : this.currentDocument.id;

        this.reviewService.getNextPicInfo(tenantId, this.groupId, currentDocId).subscribe(data => {
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
            this.getPicById(prevDocId);
        } else {
            console.warn("No previous document ID found."); // Optional: log a warning if needed
        }
    }

    // Skips the current document and moves to the next one.
    skip() {
        this.skippedDocumentIds.push(this.currentDocument.id);

        this.getNextPic(this.currentDocument.id);
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
                    this.getNextPic(lastSkipperDocId);
                } else {
                    //get next document
                    this.getNextPic(null);
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
            tenantId: this.tenant.id,
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
        this.reviewService
            .userReviewDone()
            .subscribe(
                error => {
                    console.log(error)
                });
        if (!this.router.url.includes('/review-doc'))
            this.utils.pageTrackingData = 1;
    }

}


