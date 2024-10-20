import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DocumentGroupsComponent } from './doc-groups.component';

const routes: Routes = [{ path: '', component: DocumentGroupsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentGroupsRoutingModule {}
