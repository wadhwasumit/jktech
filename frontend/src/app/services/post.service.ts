import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Post } from '../models/post.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private apiUrl = environment.apiUrl;
  constructor(
    private http: HttpClient
  ) { }


  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts`);
  }

  createPost(post: Post): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, post);
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  updatePost(post: Post, id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/posts/${id}`, post);

  }
}
