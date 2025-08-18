import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../../../shared/file-upload/file-upload.component';
import { MatDialogRef } from '@angular/material/dialog';
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
    FileUploadComponent
  ],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DocumentUploadComponent>);

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  onFileSelected(files: File[]): void {
    this.selectedFile = files.length > 0 ? files[0] : null;
  }
  onCancel() {
    this.dialogRef.close();
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
        this.dialogRef.close('uploaded');
      },
      error: () => {
        this.isUploading = false;
        this.snackBar.open('Failed to upload document', 'Close', { duration: 5000 });
      }
    });
  }
}