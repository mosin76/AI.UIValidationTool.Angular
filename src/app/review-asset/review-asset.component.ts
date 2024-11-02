import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UtilsService ,Response} from '../shared/utils.service';
import { AuthService } from '@abp/ng.core';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { NgbTypeaheadSelectItemEvent, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import {  AssetInfoInfoResponse, AssetsInfo, DocClassificationChangeSaveInfo, DocLabel, ReviewAssetService } from './review-asset.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-review-asset',
  templateUrl: './review-asset.component.html',
  styleUrl: './review-asset.component.scss'
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
 
  @ViewChild('instance', { static: false }) typeaheadInstance: NgbTypeahead;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  currentUpdate: any;
  imageUrls: string[] = [
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def',
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def',
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def',
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def',
  ];
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
    this.init();
    this.route.queryParams.subscribe(params => {
        this.groupId = params['groupId'];
        var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
        this.getLabels(tenantId);
        if (this.utils.pageTrackingData == 1) {
            this.getAsset(null);
            this.getAssetImages(null)
            this.utils.pageTrackingData = this.utils.pageTrackingData + 1;
        }
    });
  }
  getLabelName(labelId) {
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
        var tenantId: string | null = this.isTenantUser ? null : this.tenant.id;
        this.currentDocument = response.data.currentAsset;
        //this.downloadUrl = this.reviewService.getDownloadUrl(tenantId, this.currentDocument.id);
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
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    
    this.reviewService.getAsset(tenantId, this.groupId).subscribe(data => {
        debugger;
        this.handleAssetResponse(data);
        this.loading = false;
    });
  }
  getAssetImages(skipDocId: number | null) {
    this.loading = true;
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    
    this.reviewService.getAssetImages(tenantId, this.groupId).subscribe(data => {
        debugger;

        this.Assetsimages=data
        //this.handleAssetResponse(data);
        //this.loading = false;
    });
    
  }
  
  // This function is approving the predicted labels.
  approve(docLabelId: number) {
    debugger;
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
getDownloadUrl(pictureid) {
  debugger;
  this.loading = true;
    var tenantId: string| null = this.isTenantUser ? null : this.tenant.id;
    
    return this.reviewService.getimageDownloadUrl(tenantId,pictureid )
}
}
