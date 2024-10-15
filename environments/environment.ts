import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

export const environment = {
    production: false,
    application: {
        baseUrl,
        name: 'AI Validation',
        logoUrl: '',
    },
    oAuthConfig: {
        issuer: 'https://localhost:44398/',
        redirectUri: baseUrl,
        clientId: 'ValidationApp_App',
        responseType: 'code',
        scope: 'offline_access ValidationApp',
        requireHttps: true,
    },
    apis: {
        default: {
            url: 'https://localhost:44398',
            rootNamespace: 'AutoSquared.AI.ValidationApp',
        },
    },
} as Environment;
