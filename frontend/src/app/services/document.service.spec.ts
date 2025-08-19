import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { DocumentService } from './document.service';
import { EnvService } from '../env.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let http: HttpTestingController;

  const envMock: Partial<EnvService> = { apiUrl: 'http://localhost:4200/api' };
  const base = envMock.apiUrl as string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        { provide: EnvService, useValue: envMock },
        provideHttpClient(), 
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(DocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllDocuments() should GET all documents', () => {
    let result: any[] | undefined;

    service.getAllDocuments().subscribe(r => (result = r));

    const req = http.expectOne(`${base}/documents`);
    expect(req.request.method).toBe('GET');

    const mock = [{ id: '1', title: 'Doc 1' }];
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getDocument() should GET a document by id', () => {
    let result: any | undefined;

    service.getDocument('123').subscribe(r => (result = r));

    const req = http.expectOne(`${base}/documents/123`);
    expect(req.request.method).toBe('GET');

    const mock = { id: '123', title: 'Doc 123' };
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('uploadDocument() should POST FormData with title/description/file', () => {
    const file = new File(['file-bytes'], 'test.pdf', { type: 'application/pdf' });

    let ok = false;
    service.uploadDocument({ title: 'Test', description: 'Desc', file } as any).subscribe(() => (ok = true));

    const req = http.expectOne(`${base}/documents`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get('title')).toBe('Test');
    expect(body.get('description')).toBe('Desc');

    const sentFile = body.get('file') as File;
    expect(sentFile).toBeTruthy();
    expect(sentFile.name).toBe('test.pdf');
    expect(sentFile.type).toBe('application/pdf');

    req.flush({ id: 'new' });
    expect(ok).toBe(true);
  });

  it('uploadDocument() should omit description when not provided', () => {
    const file = new File(['x'], 'nofield.txt', { type: 'text/plain' });

    service.uploadDocument({ title: 'NoDesc', file } as any).subscribe();

    const req = http.expectOne(`${base}/documents`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body.get('title')).toBe('NoDesc');
    // description should not be present
    expect((body as any).has('description')).toBe(false);

    req.flush({ id: 'new2' });
  });

  it('updateDocument() should PATCH partial fields for an id', () => {
    const patch = { title: 'Updated' };

    let ok = false;
    service.updateDocument('7', patch).subscribe(() => (ok = true));

    const req = http.expectOne(`${base}/documents/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);

    req.flush({ id: '7', ...patch });
    expect(ok).toBe(true);
  });

  it('deleteDocument() should DELETE by id', () => {
    let completed = false;

    service.deleteDocument('13').subscribe({ complete: () => (completed = true) });

    const req = http.expectOne(`${base}/documents/13`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);
    expect(completed).toBe(true);
  });

  it('downloadDocument() should GET blob with responseType "blob"', () => {
    let result: Blob | undefined;

    service.downloadDocument('dl1').subscribe(r => (result = r));

    const req = http.expectOne(`${base}/documents/dl1/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    req.flush(blob);

    expect(result).toBeTruthy();
    expect(result instanceof Blob).toBe(true);
    expect(result!.type).toBe('application/pdf');
  });

  it('getDocument() should propagate HTTP errors', () => {
    let err: any;
    service.getDocument('missing').subscribe({
      next: () => {},
      error: e => (err = e),
    });

    const req = http.expectOne(`${base}/documents/missing`);
    expect(req.request.method).toBe('GET');

    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    expect(err).toBeTruthy();
    expect(err.status).toBe(404);
  });
});
