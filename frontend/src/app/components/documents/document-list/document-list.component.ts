import { Component, OnInit, inject } from '@angular/core';
import { DocumentService } from '../../../services/document.service';
import { AppDocument } from '../../../models/document.model';
// import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';
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

@Component({
  selector: 'app-document-list',
  imports: [ CommonModule,MatSpinner, RouterModule, MatMenuModule, MatDividerModule, MatIconModule,  MatCardModule, MatChipsModule, MatTableModule, FileSizePipe ],
  templateUrl: './document-list.component.html',
  styles: [`
    .list-container {
      padding: 24px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .table-card {
      margin-top: 16px;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .delete-action {
      color: #f44336;
    }
  `]
})
export class DocumentListComponent implements OnInit {
  documents: AppDocument[] = [];
  displayedColumns: string[] = ['title', 'originalName', 'size', 'createdAt', 'isIngested', 'actions'];
  isLoading = false;
  private documentService=inject(DocumentService)
  // private authService=inject(AuthService)
  private dialog= inject(MatDialog)
  private snackBar=inject(MatSnackBar)
  // constructor(
  //   private documentService: DocumentService,
  //   private authService: AuthService,
  //   private dialog: MatDialog,
  //   private snackBar: MatSnackBar
  // ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentService.getAllDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load documents', 'Close', { duration: 5000 });
      }
    });
  }

  // uploadDocument(document: AppDocument): void {
  //   // Navigate to document detail view
  //   this.router.navigate(['/post-details', this.post._id])
  // }

  viewDocument(document: AppDocument): void {
    // Navigate to document detail view
  }

  downloadDocument(doc: AppDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
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
    // Navigate to edit form or open dialog
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
