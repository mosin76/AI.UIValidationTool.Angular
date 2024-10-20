import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReviewUpdatesComponent } from './review-updates.component';

const routes: Routes = [{ path: '', component: ReviewUpdatesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReviewUpdatesRouting {}
