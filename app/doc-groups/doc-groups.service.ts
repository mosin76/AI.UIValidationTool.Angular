import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { identifierName } from '@angular/compiler';

@Injectable({
    providedIn: 'root'
})
export class DocumentGroupsApiService {
    //private baseUrl = environment.apis.default.url + '/api/document/';
    private baseUrl = environment.apis.default.url + '/api/review-docs/';
    constructor(private http: HttpClient) { }

    getGroups(tenantid): Observable<DocumentGroup[]> {
        let url = this.baseUrl + 'groups';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid;

        return this.http.get<DocumentGroup[]>(url);
    }
}

export interface DocumentGroup {
    id: number;
    name: string;
    description: string;
    itemCount: number;
}