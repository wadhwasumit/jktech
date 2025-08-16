import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IngestionJob, TriggerIngestionRequest } from '../models/ingestion.model';

@Injectable({
  providedIn: 'root'
})
export class IngestionService {
  private readonly API_URL = `${environment.apiUrl}${environment.apiPrefix}`;

  constructor(private http: HttpClient) {}

  triggerIngestion(data: TriggerIngestionRequest): Observable<IngestionJob> {
    return this.http.post<IngestionJob>(`${this.API_URL}/ingestion/trigger`, data);
  }

  getJobStatus(jobId: string): Observable<IngestionJob> {
    return this.http.get<IngestionJob>(`${this.API_URL}/ingestion/status/${jobId}`);
  }

  getAllJobs(): Observable<IngestionJob[]> {
    return this.http.get<IngestionJob[]>(`${this.API_URL}/ingestion/jobs`);
  }
}
