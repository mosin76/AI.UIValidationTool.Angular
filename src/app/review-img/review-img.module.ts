import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewImgRoutingModule } from './review-img-routing.module';
import { ReviewImgComponent } from './review-img.component';
import { SharedModule } from '../shared/shared.module';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

@NgModule({
    declarations: [ReviewImgComponent],
    imports: [
        CommonModule,
        ReviewImgRoutingModule,
        SharedModule,
        ImageViewerComponent,
        NgxImageZoomModule, // Importing the NgxImageZoomModule here
    ]
})
export class ReviewImgModule { }
