import { Component, inject, Input } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { Router } from '@angular/router';
import { Post } from '../../models/post.model';
import { AuthService } from '../../auth/service/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddPostComponent } from '../add-post/add-post.component';
import { Store } from '@ngrx/store';
import * as postActions from '../../post-store/actions';

@Component({
  selector: 'app-post',
  imports: [MatButtonModule, MatCardModule, MatDialogModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent {
  private router = inject(Router); 
  public authService = inject(AuthService)
  @Input() post!:Post;
  readonly dialog = inject(MatDialog);
  readonly store = inject(Store);
  

  viewPost() {
    this.router.navigate(['/post-details', this.post._id])
  }

  
  editPost(post: Post): void {

    const dialogRef = this.dialog.open(AddPostComponent, { width: '40vw', data: { post } });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.store.dispatch(postActions.load());

    });

  }
}
