import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReviewDocComponent } from './review-doc.component';

const routes: Routes = [{ path: '', component: ReviewDocComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReviewDocRoutingModule { }
