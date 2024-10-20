import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewImgComponent } from './review-img.component';

const routes: Routes = [{ path: '', component: ReviewImgComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReviewImgRoutingModule { }
