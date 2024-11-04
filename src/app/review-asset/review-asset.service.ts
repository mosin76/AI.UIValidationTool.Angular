import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Response } from '../shared/utils.service'; 

@Injectable({
    providedIn: 'root'
})
export class ReviewAssetService {
    //private baseUrlDoc = environment.apis.default.url + '/api/review-docs/';
    private baseUrlDoc = environment.apis.default.url + '/api/assets/';
    private baseUrlpic = environment.apis.default.url + '/api/pictures/';
    constructor(private http: HttpClient) { }

    //downloadDocument(documentId): Observable<any> {
    //    return this.http.get(this.baseUrlDoc + 'document-download/' + documentId, { responseType: 'blob' });
    //}

    getDownloadUrl(tenantId, documentId): string {
        let url = this.baseUrlDoc + 'document-download?documentId=' + documentId;
        if (tenantId !== null && tenantId !== undefined && tenantId !== '')
            url = url + '&tenantId=' + tenantId;

        return url;
    }

    getNextDocumentInfo(tenantid, caseId, curDocId): Observable<Response<AssetInfoInfoResponse>> {
        let url = this.baseUrlDoc + 'document-next';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + '&caseId=' + caseId + "&curDocId=" + (curDocId === null ? 0 : curDocId);

        return this.http.get<Response<AssetInfoInfoResponse>>(url);
    }

    // getDocumentInfo(tenantid, docId,caseId): Observable<Response<AssetInfoInfoResponse>> {
    //     let url = this.baseUrlDoc + 'document-by-id';
    //     if (tenantid !== null && tenantid !== undefined && tenantid !== '')
    //         url = url + '?tenantId=' + tenantid + "&docId=" + docId +"&caseId=" +caseId;

    //     return this.http.get<Response<AssetInfoInfoResponse>>(url);
       
    // }

    getLabels(tenantid): Observable<any> {
        let url = this.baseUrlDoc + 'labels';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid;
        return this.http.get<DocLabel[]>(url);
    }

    saveValidation(data: DocClassificationChangeSaveInfo): Observable<any> {
        return this.http.post<any>(this.baseUrlDoc + "assets-changes", data, { responseType: 'json' });
        
    }

    userReviewDone(): Observable<any> {
        return this.http.get<any>(this.baseUrlDoc + "document-review-complete");
    }
    getAsset(tenantid,caseId): Observable<Response<AssetInfoInfoResponse>> {
        let url = this.baseUrlDoc + 'assets-by-id';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + "&caseId=" +caseId;

        return this.http.get<Response<AssetInfoInfoResponse>>(url);
       
    }
    getAssetImages(tenantid,caseId): Observable<Response<Assetsimages>> {
        let url = this.baseUrlDoc + 'get-assetsimages';
        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '?tenantId=' + tenantid + "&caseId=" +caseId;

        return this.http.get<Response<Assetsimages>>(url);
       
    }
    getimageDownloadUrl(tenantId, documentId): string {
        var url = this.baseUrlDoc + 'assetsimgs-download?documentId=' + documentId;
        if (tenantId !== null && tenantId !== undefined && tenantId !== '')
            url = url + '&tenantId=' + tenantId;

        return url;
    }
   
}

export interface DocLabel {
    id: number;
    name: string;
    helpText: string;
}

export interface AssetClassification {
    id: number;
    labelId: number;
    name: string;
    userReviewState: number;
    additionalInfo: string;
    probability: number;
    Hash:string;
    Url:string;
}

export interface AssetInfoInfoResponse {
    currentAsset: AssetsInfo;
    numberOfAssets : number;
}

export interface AssetsInfo {
    userChosenLabelIds: number[];
    id: number;
    vin: string;
    Model: string;
    description: string;
    CaseId : number,
    classifications: AssetClassification[]
}

export interface DocClassificationChangeSaveInfo {
  documentId: number;
  approvedAIDocLabelIds: number[];
  rejectedAIDocLabelIds: number[];
  userChosenLabelIds: number[];
  proposedLabels: string;
  tenantId : string;
  caseId:number;

}
export interface Assetsimages{
    id :number;
    name: string;
    description:string
    type: number;
    caseId:number;
    customerId:string;
    hash:string;
    source:string;
}
