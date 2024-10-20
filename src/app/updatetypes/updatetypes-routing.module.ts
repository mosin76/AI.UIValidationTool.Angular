import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UpdateTypesComponent } from './updatetypes.component';
import { permissionGuard } from '@abp/ng.core'; // Ensure this import is correct

const routes: Routes = [
  {
    path: '',
    component: UpdateTypesComponent,
    canActivate: [permissionGuard],
  }
];

@NgModule({

  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UpdateTypesRoutingModule { }
