import { Component } from '@angular/core';
import { UtilsService, CurrentTenant } from '../shared/utils.service';
import { ActivatedRoute } from '@angular/router';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { Router } from '@angular/router';
import { ReviewUpdatesApiService } from '../shared/review-updates-api.service'; 
import { AuthService, ConfigStateService } from '@abp/ng.core';


@Component({
    selector: 'app-udpates',
    templateUrl: './updatetypes.component.html',
    styleUrls: ['./updatetypes.component.scss'],
})
export class UpdateTypesComponent extends AutoSquaredBaseComponent {
    updatetypes: UpdateType[];
    enableReviewMultipleUpdatesPage: boolean;

    constructor(private reviewService: ReviewUpdatesApiService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private config: ConfigStateService) {
            super(utils,auth, router);
    }

    loading = false;

    ngOnInit() {
        this.init();

        this.loading = true;
        var tenantId: string = this.isTenantUser ? null : this.tenant.id;
        var multipleUpdatesPageFeature = this.config.getFeature("ValidationAppFeature.ReviewMultipleUpdatesPage");
        this.enableReviewMultipleUpdatesPage = multipleUpdatesPageFeature === "true";

        this.reviewService.getEventTypeList(tenantId).subscribe(data => {
            this.updatetypes = data;
            this.loading = false;
        });
    }
}

export interface UpdateType {
    numberOfUpdates: number;
    description: String;
}
