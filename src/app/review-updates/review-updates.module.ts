import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReviewUpdatesRouting } from './review-updates-routing.module';
import { ReviewUpdatesComponent } from './review-updates.component';
import { LabelMenuComponent } from '../label-menu/label-menu.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NgbPopoverModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
    declarations: [ReviewUpdatesComponent],
    imports: [SharedModule, ReviewUpdatesRouting, LabelMenuComponent, MatMenuModule, MatButtonModule, NgbPopoverModule, NgbProgressbarModule],
})
export class ReviewUpdatesModule {}
