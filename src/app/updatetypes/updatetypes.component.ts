import { Component, AfterViewInit, Renderer2, ElementRef } from '@angular/core';
import { UtilsService } from '../shared/utils.service';
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
    p: number = 1;

    constructor(private reviewService: ReviewUpdatesApiService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private renderer: Renderer2,        // Import Renderer2
        private el: ElementRef,
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
    ngAfterViewChecked(): void {
        const links = this.el.nativeElement.querySelectorAll('a');
        links.forEach((link: HTMLElement) => {
            this.renderer.setStyle(link, 'text-decoration', 'none');
        });
    }
}

export interface UpdateType {
    numberOfUpdates: number;
    description: String;
}
