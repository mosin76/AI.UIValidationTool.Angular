import { AuthService, ConfigStateService, SessionStateService } from '@abp/ng.core';
import { Component } from '@angular/core';
import { HomeService } from './home.service';
import { Router } from '@angular/router';
import { UtilsService, CurrentTenant} from '../shared/utils.service'; 
import { AutoSquaredBaseComponent } from '../shared/autosquared-base-component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends AutoSquaredBaseComponent {

    get hasLoggedIn(): boolean {
        return this.authService.isAuthenticated;
    }
    tenants: CurrentTenant[];

    constructor(private authService: AuthService,
        private config: ConfigStateService,
        private service: HomeService,
        utils: UtilsService,
        auth: AuthService,
        router: Router) {
            super(utils,auth, router);
    }

    login() {
        this.authService.navigateToLogin();
    }

    ngOnInit() {
        this.tenant = this.utils.getCurrentTenant();
        this.isTenantUser = this.utils.isTenantUser();

        if(!this.isTenantUser){
            this.service.getTenantsList().subscribe(tenants => {
                this.tenants = tenants;
            });        
        }
    }

    gotoReviewUpdates(tenant: CurrentTenant) {
        this.utils.setCurrentTenant(tenant);

        // redirect to updates page
        this.router.navigate(['/updatetypes']);
    }

    gotoReviewDocuments(tenant: CurrentTenant) {
        this.utils.setCurrentTenant(tenant);

        // redirect to updates page
        this.router.navigate(['/doc-groups']);
    }
}