import { Injectable } from '@angular/core';
import { SessionStateService } from '@abp/ng.core';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UtilsService {
    pageTrackingData: any = 1;

    constructor(private session: SessionStateService,
        private oAuthService: OAuthService) { }

    initialize() {
        this.oAuthService.events
            .pipe(filter(event => event?.type === 'logout'),
                tap(() => {
                    sessionStorage.clear();
                    console.log("session cleared");
                })).subscribe();
        }    

    isTenantUser(): boolean {
        var tenant = this.session.getTenant();
        //const isHostString = sessionStorage.getItem("isHost");
        return tenant.isAvailable;
    }

    getCurrentTenant(): CurrentTenant {
        var sessionTenant = this.session.getTenant();
        if (sessionTenant.isAvailable) {
            return { id: sessionTenant.id, name: sessionTenant.name };
        }
        //try to check if its in session storage
        var tenantString = sessionStorage.getItem("currentTenant");
        return tenantString ? JSON.parse(tenantString) : null;
    }

    setCurrentTenant(tenant: CurrentTenant) {
        if (!this.isTenantUser()) {
            sessionStorage.setItem("currentTenant", JSON.stringify(tenant));
        }
    }
}

export class Response<TData> {
    message: string;
    success: boolean;
    data: TData
 }

export interface CurrentTenant {
    id: string;
    name: string;
}
