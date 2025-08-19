import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentService } from '../../../services/document.service';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { jest } from '@jest/globals';
describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let mockDocumentService: any;
  let mockDialogRef: any;

  beforeEach(() => {
    mockDocumentService = { uploadDocument: jest.fn() };
    mockDialogRef = { close: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DocumentUploadComponent, MatSnackBarModule],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: MatDialogRef, useValue: mockDialogRef }
      ]
    });

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not upload if form is invalid', () => {
    component.selectedFile = new File([''], 'test.pdf');
    component.uploadForm.get('title')?.setValue('');
    component.onUpload();
    expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
  });

  it('should not upload if no file selected', () => {
    component.uploadForm.get('title')?.setValue('Test');
    component.selectedFile = null;
    component.onUpload();
    expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
  });

  it('should upload and close dialog on success', () => {
    component.uploadForm.get('title')?.setValue('Test');
    component.selectedFile = new File([''], 'test.pdf');
    mockDocumentService.uploadDocument.mockReturnValue(of({}));
    component.onUpload();
    expect(mockDocumentService.uploadDocument).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith('uploaded');
  });

  it('should show error on upload failure', () => {
    component.uploadForm.get('title')?.setValue('Test');
    component.selectedFile = new File([''], 'test.pdf');
    mockDocumentService.uploadDocument.mockReturnValue(throwError(() => new Error('fail')));
    component.onUpload();
    expect(component.isUploading).toBe(false);
  });

  it('should set selectedFile on file selection', () => {
    const file = new File([''], 'test.pdf');
    component.onFileSelected([file]);
    expect(component.selectedFile).toBe(file);
  });
});