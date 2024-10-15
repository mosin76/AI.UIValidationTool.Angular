import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UpdateTypesComponent } from './updatetypes.component';

const routes: Routes = [{ path: '', component: UpdateTypesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UpdateTypesRoutingModule {}
