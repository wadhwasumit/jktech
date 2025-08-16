import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../../../shared/file-upload/file-upload.component'; // adjust path

import { DocumentService } from '../../../services/document.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    FileUploadComponent
  ],
  templateUrl: './document-upload.component.html',
  styles: [`
    .upload-container { padding: 24px; max-width: 800px; margin: 0 auto; }
    .full-width { width: 100%; margin-bottom: 16px; }
    .file-upload-section { margin: 24px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
  `]
})
export class DocumentUploadComponent {
  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  onFileSelected(files: File[]): void {
    this.selectedFile = files.length > 0 ? files[0] : null;
  }

  onUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading = true;
    const uploadData = {
      ...this.uploadForm.value,
      file: this.selectedFile
    };

    this.documentService.uploadDocument(uploadData).subscribe({
      next: () => {
        this.snackBar.open('Document uploaded successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/documents']);
      },
      error: () => {
        this.isUploading = false;
        this.snackBar.open('Failed to upload document', 'Close', { duration: 5000 });
      }
    });
  }
}
