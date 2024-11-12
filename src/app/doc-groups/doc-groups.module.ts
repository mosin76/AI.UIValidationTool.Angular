import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DocumentGroupsRoutingModule } from './doc-groups-routing.module';
import { DocumentGroupsComponent } from './doc-groups.component';
import {NgxPaginationModule} from 'ngx-pagination';

@NgModule({
    declarations: [DocumentGroupsComponent],
  imports: [SharedModule, DocumentGroupsRoutingModule,NgxPaginationModule],
})
export class DocumentGroupsModule {}
