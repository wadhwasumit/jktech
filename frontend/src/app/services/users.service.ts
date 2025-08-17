// src/app/services/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = '/api/users'; // change to your gateway origin if needed

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: Partial<User> & { email: string; name: string; role: UserRole; password?: string }) {
    return this.http.post<User>(this.base, payload);
  }

  update(id: string, payload: Partial<User>) {
    return this.http.patch<User>(`${this.base}/${id}`, payload);
  }

  updateUserRole(id: string, role: UserRole) {
    return this.http.put<User>(`${this.base}/role`, {id:id,role: role });
  }

  deleteUser(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
