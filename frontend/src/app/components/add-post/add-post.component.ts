import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatSnackBar
} from '@angular/material/snack-bar';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-add-post',
  imports: [MatFormFieldModule, MatInputModule, MatDialogModule, ReactiveFormsModule, FormsModule, MatButtonModule],
  templateUrl: './add-post.component.html',
  styleUrl: './add-post.component.scss'
})
export class AddPostComponent implements OnInit {

  fb = inject(FormBuilder);
  _snackBar = inject(MatSnackBar);
  postService = inject(PostService)
  data = inject(MAT_DIALOG_DATA);

  postForm!: FormGroup;

  ngOnInit(): void {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.max(300)]]
    })

    if (this.data) {
      this.postForm.patchValue(this.data.post)
    }
  }

  getControl(control: string): FormControl {
    return this.postForm.get(control) as FormControl;
  }

  savePost(): void {
    this.postService.createPost(this.postForm.value).subscribe((_) => {
      this._snackBar.open('Post Added successfully!!!!', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000
      });
    },
      (e) => {
        this._snackBar.open('Error while adding Post', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000
        });
      })
  }

  updatePost(): void {
    this.postService.updatePost(this.postForm.value, this.data.post._id).subscribe((_) => {
      this._snackBar.open('Post Updated successfully!!!!', 'OK', {
        horizontalPosition: 'right',
        verticalPosition: 'top',
        duration: 3000
      });
    },
      (e) => {
        this._snackBar.open('Error while adding Post', 'OK', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000
        });
      })
  }

}
