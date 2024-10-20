import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReviewDocRoutingModule } from './review-doc-routing.module';
import { ReviewDocComponent } from './review-doc.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NgbPopoverModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
//import { ImageViewerModule } from 'ng-image-viewer';
import { NgxImageZoomModule } from 'ngx-image-zoom';


@NgModule({
    declarations: [ReviewDocComponent],
    imports: [SharedModule, ReviewDocRoutingModule,NgxImageZoomModule,
        NgxExtendedPdfViewerModule, NgbPopoverModule, NgbProgressbarModule],
})
export class ReviewDocModule { }
