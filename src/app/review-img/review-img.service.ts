import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Response } from '../shared/utils.service'; 

@Injectable({
    providedIn: 'root'
})
export class ReviewImgService {
    //private baseUrlDoc = environment.apis.default.url + '/api/review-docs/';
    private baseUrlDoc = environment.apis.default.url + '/api/pictures/';
    constructor(private http: HttpClient) { }


    getDownloadUrl(tenantId, documentId): string {
        var url = this.baseUrlDoc + 'picture-download?documentId=' + documentId;
        if (tenantId !== null && tenantId !== undefined && tenantId !== '')
            url = url + '&tenantId=' + tenantId;

        return url;
    }

    getNextPicInfo(tenantid, caseId, curPicId): Observable<Response<DocumentInfoResponse>> {
        let url = this.baseUrlDoc + 'picture-next';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + '&caseId=' + caseId + "&curPicId=" + (curPicId === null ? 0 : curPicId);

        return this.http.get<Response<DocumentInfoResponse>>(url);
    }

    getPicInfo(tenantid, picId,caseId): Observable<Response<DocumentInfoResponse>> {
        let url = this.baseUrlDoc + 'picture-by-id';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + "&picId=" + picId +"&caseId=" +caseId;

        return this.http.get<Response<DocumentInfoResponse>>(url);
    }

    getLabels(tenantid): Observable<any> {
        let url = this.baseUrlDoc + 'labels';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid;
        return this.http.get<DocLabel[]>(url);
    }

    saveValidation(data: DocClassificationChangeSaveInfo): Observable<any> {

        return this.http.post<any>(this.baseUrlDoc + "picture-changes", data, { responseType: 'json' });
    }

    userReviewDone(): Observable<any> {
        return this.http.get<any>(this.baseUrlDoc + "picture-review-complete");
    }
}

export interface DocLabel {
    id: number;
    name: string;
    helpText: string;
}

export interface DocClassification {
    id: number;
    labelId: number;
    name: string;
    userReviewState: number;
    additionalInfo: string;
    probability: number;
}

export interface DocumentInfoResponse {
    currentDocument: DocumentInfo;
    numberOfDocuments : number;
}

export interface DocumentInfo {
    userChosenLabelIds: number[];
    id: number;
    name: string;
    type: string;
    description: string;
    
    classifications: DocClassification[]
}

export interface DocClassificationChangeSaveInfo {
    documentId: number;
    approvedAIDocLabelIds: number[];
    rejectedAIDocLabelIds: number[];
    userChosenLabelIds: number[];
    proposedLabels: string;
    tenantId : string;
    caseId : number;
}

