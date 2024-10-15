import { Component } from '@angular/core';
import { UtilsService, CurrentTenant } from '../shared/utils.service';
import { ActivatedRoute } from '@angular/router';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { Router } from '@angular/router';
import { DocumentGroupsApiService } from './doc-groups.service';
import { DocumentGroup } from './doc-groups.service';
import { AuthService } from '@abp/ng.core';


@Component({
    selector: 'app-doc-groups',
    templateUrl: './doc-groups.component.html',
    styleUrls: ['./doc-groups.component.scss'],
})
export class DocumentGroupsComponent extends AutoSquaredBaseComponent {
    groups: DocumentGroup[];

    constructor(private reviewService: DocumentGroupsApiService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,
        private route: ActivatedRoute,) {
            super(utils,auth, router);
    }

    loading = false;

    ngOnInit() {
        this.init();

        this.loading = true;
        var tenantId: string = this.isTenantUser ? null : this.tenant.id;

        this.reviewService.getGroups(tenantId).subscribe(data => {
            this.groups = data;
            this.loading = false;
        });
    }
}
