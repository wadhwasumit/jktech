import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QARequest, QAResponse } from '../models/ingestion.model';

@Injectable({
  providedIn: 'root'
})
export class QaService {
  private readonly API_URL = `${environment.apiUrl}${environment.apiPrefix}`;

  constructor(private http: HttpClient) {}

  askQuestion(data: QARequest): Observable<QAResponse> {
    return this.http.post<QAResponse>(`${this.API_URL}/qa/ask`, data);
  }
}