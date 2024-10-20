import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { UpdateTypesRoutingModule } from './updatetypes-routing.module';
import { UpdateTypesComponent } from './updatetypes.component';


@NgModule({
  declarations: [UpdateTypesComponent],
  imports: [SharedModule, UpdateTypesRoutingModule],
})
export class UpdateTypesModule {}
