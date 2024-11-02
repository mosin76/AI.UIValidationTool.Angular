import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReviewAssetComponent } from './review-asset.component';

const routes: Routes = [{ path: '', component: ReviewAssetComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReviewAssetRoutingModule { }