import { Component } from '@angular/core';
import { UtilsService } from '../shared/utils.service';
import { Router } from '@angular/router';
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';
import { DocumentGroupsApiService, DptaGroup } from './doc-groups.service';

import { AuthService } from '@abp/ng.core';


@Component({
    selector: 'app-doc-groups',
    templateUrl: './doc-groups.component.html',
    styleUrls: ['./doc-groups.component.scss'],
})
export class DocumentGroupsComponent extends AutoSquaredBaseComponent {
    groups: DptaGroup[] = [];
    imgBaseUrl: string = '/review-img';
    docBaseUrl: string = '/review-doc';

    constructor(private reviewService: DocumentGroupsApiService,
        utils: UtilsService,
        router: Router,
        auth: AuthService,) {
            super(utils,auth, router);
    }

    loading = false;

    getGroup(name: string): DptaGroup {

        if (this.groups === undefined)
            this.groups = [];

        let g = this.groups.find(g => g.name === name);

        if (g === undefined) {
            // Add a new one
            g = new DptaGroup();
            g.name = name;
            g.numOfDocs = 0;
            g.numOfImages = 0;

            this.groups.push(g);
        }
        return g;
    }


    ngOnInit() {
        this.init();

        this.loading = true;
        let tenantId: string = this.isTenantUser ? '' : this.tenant.id ?? '';

        this.reviewService.getGroups(tenantId).subscribe(data => {
            //add the data to groups variable
            data.forEach(d => {
                var g = this.getGroup(d.name);
                g.numOfDocs = d.itemCount;
            });

            this.loading = false;
        });

        this.reviewService.getPictures(tenantId).subscribe(data => {
            data.forEach(d => {
                var g = this.getGroup(d.name);
                g.numOfImages = d.itemCount;
            });

            this.loading = false;
        });

    }
}
