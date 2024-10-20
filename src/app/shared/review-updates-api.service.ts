import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReviewUpdatesApiService {
    private baseUrl = environment.apis.default.url + '/api/review-updates/';

    constructor(private http: HttpClient) { }

    getEventTypeList(tenantId): Observable<any> {
        let url = this.baseUrl + 'update-types';
        if (tenantId !== null && tenantId !== undefined && tenantId !== '')
            url = url + '?tenantId=' + tenantId;

        return this.http.get<any>(url);
    }

    getUpdateList(eventTypeId, pageNum, perPage, tenantid): Observable<any> {
        let url = this.baseUrl + 'updates-by-reviewstatus?eventTypeId=' + eventTypeId + '&ReviewStatus=0&PageIndex=' + pageNum + '&PageSize=' + perPage

        if (tenantid !== null && tenantid !== undefined && tenantid !== '')
            url = url + '&tenantId=' + tenantid;

        return this.http.get<any>(url);
    }

    getClassificationLabelsTree(): Observable<any> {
        return this.http.get<LabelNode[]>(this.baseUrl + 'classification-labels-tree');
    }

    getClassificationLabels(): Observable<any> {
        return this.http.get<any>(this.baseUrl + 'classification-labels');
    }

    saveUpdateReview(data: ReviewChangeSaveInfo): Observable<any> {
        return this.http.post<any>(this.baseUrl + "user-classification-changes", data, { responseType: 'json' });
    }

    userUpdatesReviewDone(): Observable<any> {
        return this.http.get<any>(this.baseUrl + "updates-review-done");
    }
}

export interface LabelNode {
    id: number;
    name: string;
    parentLabelId: number;
    childLabels: LabelNode[];
    helpText: string;
}

export interface ReviewChangeSaveInfo {
    eventTypeId: number;
    tenantId: string;
    changes: UpdateChangeSaveInfo[];
}

export interface UpdateChangeSaveInfo {
    updateId: number;
    approvedAIUpdateLabelIds: number[];
    rejectedAIUpdateLabelIds: number[];
    userChosenLabelIds: number[];
    proposedLabels: string;
}