import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile } from 'rxjs';

export type IngestionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export interface IngestionJob {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: IngestionStatus;
  progress: number;
  documentIds: string[];
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class IngestionApiService {
  private base = '/api/ingestion'; // proxy to NestJS

  constructor(private http: HttpClient) {}

  trigger(documentIds: string[], reindex = false): Observable<IngestionJob> {
    return this.http.post<IngestionJob>(`${this.base}/job/trigger`, { documentIds });
  }

  getJob(jobId: string): Observable<IngestionJob> {
    return this.http.get<IngestionJob>(`${this.base}/job/status/${jobId}`);
  }

  listJobs(limit = 50, offset = 0): Observable<IngestionJob[]> {
    return this.http.get<IngestionJob[]>(`${this.base}/jobs`, { params: { limit, offset } as any });
  }

  cancel(jobId: string): Observable<{ canceled: boolean }> {
    return this.http.post<{ canceled: boolean }>(`${this.base}/cancel/${jobId}`, {});
  }

  pollJob(jobId: string, ms = 2000): Observable<IngestionJob> {
    return interval(ms).pipe(
      switchMap(() => this.getJob(jobId)),
      takeWhile(j => j.status === 'queued' || j.status === 'running', true),
    );
  }
}
