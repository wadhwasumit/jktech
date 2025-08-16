import { Component, inject, Input } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { Post } from '../../models/post.model';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../services/post.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-post-detail',
  imports: [ MatButtonModule, MatCardModule, CommonModule],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent {

  private route = inject(ActivatedRoute);
  postId = this.route.snapshot.paramMap.get('id') || '';

  post!: Observable<Post>;

  constructor(private postService: PostService) {
    this.post = this.postService.getPostById(this.postId)
  }
}
