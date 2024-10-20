import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { identifierName } from '@angular/compiler';

@Injectable({
    providedIn: 'root'
})
export class DocumentGroupsApiService {
    private docbaseUrl = environment.apis.default.url + '/api/documents/';
    private imgbaseurl = environment.apis.default.url +'/api/pictures/';
    //private docbaseUrl = environment.apis.default.url + '/api/review-docs/';
    constructor(private http: HttpClient) { }

    getGroups(tenantid): Observable<DocumentGroup[]> {
        let url = this.docbaseUrl + 'groups';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid;

        return this.http.get<DocumentGroup[]>(url);
    }
    getPictures(tenantid): Observable<any[]> {
        let url = this.imgbaseurl + 'groups';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid;

        return this.http.get<any[]>(url);
    }
}

export interface DocumentGroup {
    id: number;
    name: string;
    description: string;
    itemCount: number;
}


export class DptaGroup {
    id: number;
    name: string;
    numOfDocs: number;
    numOfImages: number;
}

