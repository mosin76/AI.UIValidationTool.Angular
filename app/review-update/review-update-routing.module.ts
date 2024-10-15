import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReviewUpdateComponent } from './review-update.component';

const routes: Routes = [{ path: '', component: ReviewUpdateComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReviewUpdateRoutingModule { }
