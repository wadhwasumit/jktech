import { Component, OnInit, inject } from '@angular/core';
import { DocumentService } from '../../../services/document.service';
import { AppDocument } from '../../../models/document.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';  
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import {MatButtonModule} from '@angular/material/button';
@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    MatSpinner,
    RouterModule,
    MatMenuModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatButtonModule,
    FileSizePipe
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  documents: AppDocument[] = [];
  displayedColumns: string[] = ['title', 'originalName', 'size', 'createdAt', 'isIngested', 'actions'];
  isLoading = false;

  private readonly documentService = inject(DocumentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly dialog = inject(MatDialog);

  openUploadDialog() {
    const dialogRef = this.dialog.open(DocumentUploadComponent, {
      maxWidth: '600px',
      width: '95%',
    });

    dialogRef.afterClosed().subscribe(result => {
      // Optionally reload documents if upload was successful
      if (result === 'uploaded') {
        this.loadDocuments();
      }
    });
  }
  
  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentService.getAllDocuments().subscribe({
      next: documents => {
        this.documents = documents;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load documents', 'Close', { duration: 5000 });
      }
    });
  }

  viewDocument(document: AppDocument): void {
    this.router.navigate(['/documents', document.id]);
  }

  downloadDocument(doc: AppDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Failed to download document', 'Close', { duration: 5000 });
      }
    });
  }

  editDocument(document: AppDocument): void {
    this.router.navigate(['/documents/edit', document.id]);
  }

  deleteDocument(document: AppDocument): void {
    if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
      this.documentService.deleteDocument(document.id).subscribe({
        next: () => {
          this.loadDocuments();
          this.snackBar.open('Document deleted successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete document', 'Close', { duration: 5000 });
        }
      });
    }
  }
}