import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Response } from '../shared/utils.service'; 

@Injectable({
    providedIn: 'root'
})
export class ReviewDocService {
    private baseUrl = environment.apis.default.url + '/api/review-docs/';

    constructor(private http: HttpClient) { }

    downloadDocument(documentId): Observable<any> {
        return this.http.get(this.baseUrl + 'document-download/' + documentId, { responseType: 'blob' });
    }

    getDownloadUrl(documentId): string {
        return this.baseUrl + 'document-download/' + documentId;
    }

    getNextDocumentInfo(tenantid, caseId, curDocId): Observable<Response<DocumentInfoResponse>> {
        let url = this.baseUrl + 'document-next';

        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + '&caseId=' + caseId + "&curDocId=" + (curDocId === null ? 0 : curDocId);

        return this.http.get<Response<DocumentInfoResponse>>(url);
    }

    getDocumentInfo(tenantid, docId): Observable<Response<DocumentInfoResponse>> {
        let url = this.baseUrl + 'document-by-id';

        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + "&docId=" + docId;

        return this.http.get<Response<DocumentInfoResponse>>(url);
    }

    getLabels(): Observable<any> {
        return this.http.get<DocLabel[]>(this.baseUrl + 'labels');
    }

    saveValidation(data: DocClassificationChangeSaveInfo): Observable<any> {
        return this.http.post<any>(this.baseUrl + "document-changes", data, { responseType: 'json' });
    }

    userReviewDone(): Observable<any> {
        return this.http.get<any>(this.baseUrl + "document-review-complete");
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
}
