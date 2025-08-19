// src/app/components/documents/document-list/document-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DocumentListComponent } from './document-list.component';
import { DocumentService } from '../../../services/document.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
// If TS complains about "jest", add "types": ["jest","node"] to tsconfig.spec.json
// or uncomment:  import { jest } from '@jest/globals';

describe('DocumentListComponent (Jest)', () => {
  let fixture: ComponentFixture<DocumentListComponent>;
  let component: DocumentListComponent;

  let mockDocumentService: jest.Mocked<
    Pick<DocumentService, 'getAllDocuments' | 'downloadDocument' | 'deleteDocument'>
  >;
  let mockDialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let mockRouter: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    mockDocumentService = {
      getAllDocuments: jest.fn(),
      downloadDocument: jest.fn(),
      deleteDocument: jest.fn(),
    };

    mockDialog = {
      open: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        DocumentListComponent, // standalone component
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads documents on init', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(
      of([{ id: '1', title: 'Doc', originalName: 'doc.pdf', size: 1234, createdAt: new Date(), isIngested: true }] as any)
    );

    component.ngOnInit();

    expect(mockDocumentService.getAllDocuments).toHaveBeenCalled();
    expect(component.documents.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('shows empty state when no documents', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(of([]));

    component.ngOnInit();

    expect(mockDocumentService.getAllDocuments).toHaveBeenCalled();
    expect(component.documents.length).toBe(0);
    expect(component.isLoading).toBe(false);
  });

  it('handles document download', () => {
    const blob = new Blob(['test'], { type: 'application/pdf' });
    mockDocumentService.downloadDocument.mockReturnValue(of(blob));

    const doc = { id: '1', originalName: 'doc.pdf' } as any;
    component.downloadDocument(doc);

    expect(mockDocumentService.downloadDocument).toHaveBeenCalledWith('1');
  });

  it('deletes a document after confirm', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockDocumentService.deleteDocument.mockReturnValue(of(void 0));

    component.documents = [{ id: '1', title: 'Doc' } as any];

    component.deleteDocument(component.documents[0]);

    expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('1');
  });

  it('does not delete when confirm is canceled', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    component.documents = [{ id: '1', title: 'Doc' } as any];

    component.deleteDocument(component.documents[0]);

    expect(mockDocumentService.deleteDocument).not.toHaveBeenCalled();
  });

  it('sets loading=false when load fails', () => {
    mockDocumentService.getAllDocuments.mockReturnValue(throwError(() => new Error('fail')));

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
  });
});
