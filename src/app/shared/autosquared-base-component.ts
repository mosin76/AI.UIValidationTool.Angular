import { UtilsService, CurrentTenant } from './utils.service'; 
import { Router } from '@angular/router';
import { AuthService } from '@abp/ng.core';

export class AutoSquaredBaseComponent {
    tenant: CurrentTenant;
    isTenantUser: boolean;
    loading: boolean = false;
    saving: boolean = false;

    constructor(protected utils: UtilsService,
        protected auth: AuthService,
        protected router: Router) { }

    init(): void {


        this.tenant = this.utils.getCurrentTenant();
        this.isTenantUser = this.utils.isTenantUser();

        if(!this.isTenantUser && this.tenant === null){
            this.router.navigate(['']);
        }
    }
}
