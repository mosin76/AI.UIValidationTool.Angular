import { Environment } from '@abp/ng.core';

//const baseUrl = 'https://blue-tree-0ab06dd0f.5.azurestaticapps.net';    //qa
const baseUrl = 'https://icy-ground-09ceafc0f.5.azurestaticapps.net';    //rod

export const environment = {
    production: true,
    application: {
        baseUrl,
        name: 'ValidationApp',
        logoUrl: '',
    },
    oAuthConfig: {
        //issuer: 'https://autosquaredaivalidationapphttpapihost.azurewebsites.net/',   //qa
        issuer: 'https://aibeapp-autosquared-prod-us.azurewebsites.net/',   //prod
        redirectUri: baseUrl,
        clientId: 'ValidationApp_App',
        responseType: 'code',
        scope: 'offline_access ValidationApp',
        requireHttps: true
    },
    apis: {
        default: {
            //url: 'https://autosquaredaivalidationapphttpapihost.azurewebsites.net', //qa
            url: 'https://aibeapp-autosquared-prod-us.azurewebsites.net', //prod
            rootNamespace: 'AutoSquared.AI.ValidationApp',
        },
    },
} as Environment;
