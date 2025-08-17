import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppDocument, CreateDocumentRequest } from '../models/document.model';
import { EnvService } from '../env.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  // private readonly API_URL = `${environment.apiUrl}${environment.apiPrefix}`;
  API_URL:String;

  constructor(private http: HttpClient,private env: EnvService) {
    this.API_URL = this.env.apiUrl;
  }

  getAllDocuments(): Observable<AppDocument[]> {
    return this.http.get<AppDocument[]>(`${this.API_URL}/documents`);
  }

  getDocument(id: string): Observable<AppDocument> {
    return this.http.get<AppDocument>(`${this.API_URL}/documents/${id}`);
  }

  uploadDocument(data: CreateDocumentRequest): Observable<AppDocument> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('file', data.file);

    return this.http.post<AppDocument>(`${this.API_URL}/documents`, formData);
  }

  updateDocument(id: string, data: Partial<AppDocument>): Observable<AppDocument> {
    return this.http.patch<AppDocument>(`${this.API_URL}/documents/${id}`, data);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/documents/${id}`);
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/documents/${id}/download`, {
      responseType: 'blob'
    });
  }
}