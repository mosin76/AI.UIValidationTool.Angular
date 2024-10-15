import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReviewUpdateRoutingModule } from './review-update-routing.module';
import { ReviewUpdateComponent } from './review-update.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NgbPopoverModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { LabelMenuComponent } from '../label-menu/label-menu.component';

@NgModule({
    declarations: [ReviewUpdateComponent],
    imports: [SharedModule, ReviewUpdateRoutingModule, MatMenuModule, MatButtonModule, NgbPopoverModule, NgbProgressbarModule, LabelMenuComponent],

})
export class ReviewUpdateModule { }
