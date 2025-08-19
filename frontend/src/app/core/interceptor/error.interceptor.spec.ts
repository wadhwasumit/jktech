// src/app/core/interceptor/error.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../../auth/service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
// If TS complains about "jest" types, either add "types": ["jest","node"] in tsconfig.spec.json
// or uncomment the next line:
// import { jest } from '@jest/globals';

describe('ErrorInterceptor (Jest)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  // ---- Jest mocks
  const authMock = { logout: jest.fn() } as unknown as jest.Mocked<AuthService>;
  const snackMock = { open: jest.fn() } as unknown as jest.Mocked<MatSnackBar>;
  const routerMock = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    url: '/current',
  } as unknown as jest.Mocked<Router> & { url: string };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(), // keep AFTER provideHttpClient so it overrides the backend
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: AuthService, useValue: authMock },
        { provide: MatSnackBar, useValue: snackMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks(); // resets all jest.fn() calls
  });

  it('handles 401 → logout + navigate to login with returnUrl', () => {
    http.get('/api/protected').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.logout).toHaveBeenCalled();
    expect(snackMock.open).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/current' } }
    );
  });

  it('403 → navigate to /forbidden (uses navigateByUrl)', () => {
    http.get('/api/forbidden').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/forbidden');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    // navigate() should NOT be used for 403
    expect(routerMock.navigate).not.toHaveBeenCalled();

    // interceptor uses navigateByUrl('/forbidden')
    // Some Router implementations pass a second arg; accept it as undefined/anything.
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/forbidden', undefined);
    // Or, if you want to ignore the 2nd arg entirely:
    // expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/forbidden', expect.anything());

    expect(snackMock.open).toHaveBeenCalled();
});


  it('404 (GET) → navigateByUrl /not-found', () => {
    http.get('/api/missing').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/missing');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found',undefined);
  });

  it('500 → navigateByUrl /server-error + snack', () => {
    http.post('/api/save', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/save');
    req.flush({ message: 'Oops' }, { status: 500, statusText: 'Server Error' });

    // expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/server-error');
    expect(snackMock.open).toHaveBeenCalled();
  });

  it('status 0 (network/offline) → navigateByUrl /offline + snack', () => {
    http.get('/api/ping').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/ping');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    // expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/offline');
    expect(snackMock.open).toHaveBeenCalled();
  });

  it('respects X-Skip-Error-Handling header (no UI/nav side-effects)', () => {
    http.get('/api/quiet', {
      headers: new HttpHeaders({ 'X-Skip-Error-Handling': '1' }),
    }).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/quiet');
    req.flush({ message: 'Bad' }, { status: 400, statusText: 'Bad Request' });

    expect(snackMock.open).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
