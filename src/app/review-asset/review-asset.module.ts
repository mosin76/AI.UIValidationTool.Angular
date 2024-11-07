import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReviewAssetRoutingModule } from './review-asset-routing.module';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NgbPopoverModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { ReviewAssetComponent } from './review-asset.component';
import { RmImageSliderComponent } from 'rm-image-slider';


@NgModule({
    declarations: [ReviewAssetComponent],
    imports: [SharedModule, ReviewAssetRoutingModule, NgxImageZoomModule, RmImageSliderComponent,
        NgxExtendedPdfViewerModule, NgbPopoverModule, NgbProgressbarModule],
})
export class ReviewAssetModule { }
