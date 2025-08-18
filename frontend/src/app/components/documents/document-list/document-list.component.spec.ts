import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentListComponent } from './document-list.component';
import { DocumentService } from '../../../services/document.service';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let mockDocumentService: any;
  let mockDialog: any;
  let mockRouter: any;

  beforeEach(() => {
    mockDocumentService = {
      getAllDocuments: jest.fn(),
      downloadDocument: jest.fn(),
      deleteDocument: jest.fn()
    };
    mockDialog = { open: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DocumentListComponent, MatSnackBarModule],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
  });

  it('should load documents on init', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(of([{ id: '1', title: 'Doc', originalName: 'doc.pdf', size: 1234, createdAt: new Date(), isIngested: true }]));
    component.ngOnInit();
    expect(component.documents.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should show empty state if no documents', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(of([]));
    component.ngOnInit();
    expect(component.documents.length).toBe(0);
  });

  it('should handle document download', () => {
    const blob = new Blob(['test'], { type: 'application/pdf' });
    mockDocumentService.downloadDocument.mockReturnValue(of(blob));
    const doc = { id: '1', originalName: 'doc.pdf' } as any;
    component.downloadDocument(doc);
    expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('1');
  });

  it('should handle document delete', () => {
    mockDocumentService.deleteDocument.mockReturnValue(of({}));
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    component.documents = [{ id: '1', title: 'Doc' } as any];
    component.deleteDocument(component.documents[0]);
    expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('1');
  });

  it('should show error on failed load', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
  });
});