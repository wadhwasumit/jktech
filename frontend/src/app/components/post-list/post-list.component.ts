import { Component, inject, OnInit } from '@angular/core';
import { PostComponent } from '../post/post.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,

  MatDialogModule,

} from '@angular/material/dialog';
import { AddPostComponent } from '../add-post/add-post.component';
import { Store } from '@ngrx/store';
import { selectPosts$ } from '../../post-store/selectors';
import * as postActions from '../../post-store/actions';
import { Observable } from 'rxjs';
import { Post } from '../../models/post.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-post-list',
  imports: [PostComponent, MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule, CommonModule],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit {


  readonly dialog = inject(MatDialog);
  readonly store = inject(Store)

  posts$!: Observable<Post[]>

  ngOnInit(): void {
    this.posts$ = this.store.select(selectPosts$);
    this.store.dispatch(postActions.load());
  }
  addPost(): void {
    const dialogRef = this.dialog.open(AddPostComponent, { width: '40vw' });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.store.dispatch(postActions.load());

    });
  }

}
