import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {  
  // get the base url from environment.ts
  private baseUrl = environment.apis.default.url + '/api/';

  constructor(private http: HttpClient) { }

    getTenantsList(): Observable<any> {
        return this.http.get<any[]>(this.baseUrl + 'review-updates/tenants').pipe(
            map(tenants => tenants.filter(tenant => tenant.isActive)))
    }
}
