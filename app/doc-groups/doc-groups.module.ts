import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DocumentGroupsRoutingModule } from './doc-groups-routing.module';
import { DocumentGroupsComponent } from './doc-groups.component';


@NgModule({
    declarations: [DocumentGroupsComponent],
  imports: [SharedModule, DocumentGroupsRoutingModule],
})
export class DocumentGroupsModule {}
