import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UtilsService ,Response} from '../shared/utils.service';
import { AuthService } from '@abp/ng.core';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import {  AssetInfoInfoResponse, Assetsimages, AssetsInfo, DocClassificationChangeSaveInfo, DocLabel, ReviewAssetService } from './review-asset.service';
import { Subject } from 'rxjs';
import { RmImageSliderComponent } from 'rm-image-slider';
import { ImageObject } from 'rm-image-slider/lib/interface';

@Component({
  selector: 'app-review-asset',
  templateUrl: './review-asset.component.html',
  styleUrl: './review-asset.component.scss',
})
export class ReviewAssetComponent extends AutoSquaredBaseComponent{
  loading: boolean = false;
  saving: boolean = false;
  searchLabelSelectionModel: {};
  canSave = false;
  proposedLabels: string;
  showCustomLabelInput: boolean;
  labels: DocLabel[];
  availableLabels: DocLabel[];
  currentDocument: AssetsInfo;
  totalCount: number;
  skippedDocumentIds: number[] = [];
  downloadUrl: string | null = null;
  pdfDownloadProgress: number = 0;
  groupId: number;
  Assetsimages:any;
  fileLoadingError: string;
    imageObjectmox: Array<ImageObject> = []; 
    FullimageObjectmox: Array<ImageObject> = [];
  imageElement: any;
  isImagePopupVisible = false;

  imageScale: any;
  isModalOpen = false;
  currentImage: { thumbImage?: string; posterImage?: string; title?: string } | null = null;

 
  @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  currentUpdate: any;
 
  constructor(
    private route: ActivatedRoute,
    private reviewService: ReviewAssetService,
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
        this.isModalOpen = false;
    this.init();
    this.route.queryParams.subscribe(params => {
        this.groupId = params['groupId'];
        var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
        this.getLabels(tenantId);
        if (this.utils.pageTrackingData == 1) {
            this.getAsset(null);
            this.getAssetThumbImages(null);
            this.getAssetFullImages(null);
            this.utils.pageTrackingData = this.utils.pageTrackingData + 1;
        }
    });
  }
  ngAfterViewInit() {
}
   
 

    getLabelName(labelId) {
        this.isModalOpen = false;
    let labelIndex = this.labels.findIndex(x => x.id === labelId);
    return this.labels[labelIndex]?.name || '';
}
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
  //Handles the document response, updating the current document, available labels, and save state.
    handleAssetResponse(response: Response<AssetInfoInfoResponse>) {
        this.isModalOpen = false;
   
    if (response.success === false) {
        this.toastr.error(response.message);
        console.log(response.message);
        return;
    }

    if (response.data === null || response.data.numberOfAssets === null) {
        this.totalCount = 0;
        this.downloadUrl = null;
       // this.isImage=null;
        
    }
    else {
        this.isModalOpen = false;
        var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
        this.currentDocument = response.data.currentAsset;

        this.totalCount = response.data.numberOfAssets;
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
  getAsset(skipDocId: number | null) {
      this.loading = true;
      this.isModalOpen = false;
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    
    this.reviewService.getAsset(tenantId, this.groupId).subscribe(data => {
        this.handleAssetResponse(data);
        this.loading = false;
    });
  }
    getAssetThumbImages(skipDocId: number | null) {
        this.isModalOpen = false;
    this.loading = true;
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    
    this.reviewService.getAssetImages(tenantId, this.groupId).subscribe(data => {
        this.Assetsimages=data;
        this.imageObjectmox.pop();

        this.Assetsimages.forEach(item => {
          let url=this.getDownloadThumbnailUrl(item.id);
          this.imageObjectmox.push({
            image:url,
            thumbImage:url,
              title: item.name,
              index: this.imageObjectmox.length
        });
      });
        
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
  // Retrieves the help text for a specific label by its ID.
  getLabelHelpText(labelId) {
    if (this.labels === null)
        return null;

    return this.labels.find(x => x.id === labelId)?.helpText;
}
    getDownloadThumbnailUrl(pictureid) {
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    return this.reviewService.getThumbnailDownloadUrl(tenantId,pictureid )
    }
    getDownloadFullImgUrl(pictureid) {
        var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
        return this.reviewService.getFullImageDownloadUrl(tenantId, pictureid)
       
    }
// Prepares the document's review state information for saving.
getUpdateSaveInfo(): DocClassificationChangeSaveInfo {
  
  const approvedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === 1).map(x => x.labelId);
  const rejectedAIDocLabelIds = this.currentDocument.classifications.filter(x => x.userReviewState === -1).map(x => x.labelId);
  const userChosenLabelIds = [];

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
      this.router.navigate(['/doc-groups']);
      //if anything skipped, give option to the user to move to next skipped document
      const isLast = this.totalCount - this.skippedDocumentIds.length === 1;
                     
  }).add(() => {
      this.saving = false;
  });
    }

// Handles errors when an image fails to load.
imageLoadFailed(error: Event) {
 
  console.error('Image load failed:', error, ' URL', this.downloadUrl);
  this.fileLoadingError = error.toString();
  //this.currentDocument.type = 'E';
    }
    getAssetFullImages(skipDocId: number | null): void {
        this.isModalOpen = false;
        const tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
        this.loading = true;
        this.reviewService.getAssetImages(tenantId, this.groupId).subscribe(data => {
            this.Assetsimages = data;
            this.FullimageObjectmox = [];
            this.Assetsimages.forEach((item, index) => {
                const url = this.getDownloadFullImgUrl(item.id);
                this.FullimageObjectmox.push({
                    image: url,
                    posterImage: url,
                    title: item.name,
                    index
                });
                this.loading = false;
            });
            const initialIndex = skipDocId
                ? this.FullimageObjectmox.findIndex(item => item.index === skipDocId)
                : 0;

            this.openModal(initialIndex);
        });
    }
    openModal(index: number): void {

        this.currentImage = this.FullimageObjectmox[index];
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.currentImage = null;
    }

ngOnDestroy(): void {
  this.reviewService
      .userReviewDone()
      .subscribe(
          error => {
              console.log(error)
          });
  if (!this.router.url.includes('/review-asset'))
      this.utils.pageTrackingData = 1;
}
imageObjects: Array<object> = [{
  video: 'https://youtu.be/6pxRHBw-k8M' // Youtube url
},
{
video: 'assets/video/movie.mp4', // MP4 Video url
},
{
video: 'assets/video/movie2.mp4',
  posterImage: 'assets/img/slider/2_min.jpeg', //Optional: You can use this key if you want to show video poster image in slider
  title: 'Image title'
},
{
image: 'getDownloadUrl(1465)',
  thumbImage: 'assets/img/slider/1_min.jpeg',
  alt: 'Image alt'
}

    ];
    config = {
        thumbnailWidth: 200,
        thumbnailHeight: 200,
    };
}
