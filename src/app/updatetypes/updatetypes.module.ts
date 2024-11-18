import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { UpdateTypesRoutingModule } from './updatetypes-routing.module';
import { UpdateTypesComponent } from './updatetypes.component';
import { NgxPaginationModule } from 'ngx-pagination';


@NgModule({
  declarations: [UpdateTypesComponent],
    imports: [SharedModule, UpdateTypesRoutingModule, NgxPaginationModule],
})
export class UpdateTypesModule {}
