import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ABP, authGuard, eLayoutType, permissionGuard } from '@abp/ng.core';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        canActivate: [authGuard],
        loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    },
    {
        path: 'account',
        loadChildren: () => import('@abp/ng.account').then(m => m.AccountModule.forLazy()),
    },
    {
        path: 'identity',
        loadChildren: () => import('@abp/ng.identity').then(m => m.IdentityModule.forLazy()),
    },
    {
        path: 'tenant-management',
        loadChildren: () =>
            import('@abp/ng.tenant-management').then(m => m.TenantManagementModule.forLazy()),
    },
    {
        path: 'setting-management',
        loadChildren: () =>
            import('@abp/ng.setting-management').then(m => m.SettingManagementModule.forLazy()),
    },
    {
        path: 'updatetypes',
        loadChildren: () => import('./updatetypes/updatetypes.module').then(m => m.UpdateTypesModule),
        canActivate: [permissionGuard],
        data: {
            routes: {
                requiredPolicy: 'ValidationApp.URTAPermission',
                name: "Review Updates",
                order: 2,
                iconClass: "fa fa-comments",
                layout: eLayoutType.application
                
            } as ABP.Route
        }
    },
    {
        path: 'doc-groups',
        loadChildren: () => import('./doc-groups/doc-groups.module').then(m => m.DocumentGroupsModule),
        canActivate: [permissionGuard],
        data: {
            routes: {
                requiredPolicy: 'ValidationApp.DPTAPermission',
                name: "Review Documents",
                order: 3,
                iconClass: "fa fa-file-image",
                layout: eLayoutType.application
            } as ABP.Route
        }
    },
        {
        path: 'review-updates',
        loadChildren: () => import('./review-updates/review-updates.module').then(m => m.ReviewUpdatesModule),
        canActivate: [authGuard],
    },
    {
        path: 'review-img',
        loadChildren: () => import('./review-img/review-img.module').then(m => m.ReviewImgModule),
        canActivate: [authGuard],
    },
    {
        path: 'review-update',
        loadChildren: () => import('./review-update/review-update.module').then(m => m.ReviewUpdateModule),
        canActivate: [authGuard]
    },
    {
        path: 'review-doc',
        loadChildren: () => import('./review-doc/review-doc.module').then(m => m.ReviewDocModule),
        canActivate: [authGuard]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
