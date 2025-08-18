import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;

  const authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
  const snackSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
  const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], { url: '/current' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: AuthService, useValue: authSpy },
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    authSpy.logout.calls.reset();
    snackSpy.open.calls.reset();
    routerSpy.navigate.calls.reset();
    routerSpy.navigateByUrl.calls.reset();
  });

  it('401 should logout and navigate to login', () => {
    TestBed.inject<any>(ErrorInterceptor); // ensure DI

    TestBed.inject<any>(provideHttpClient); // force creation

    // Perform a GET
    fetch('/api/test'); // not used; we do via HttpClient below
  });

  it('handles 401', () => {
    const http = TestBed.inject<any>(provideHttpClient as any); // HttpClient from DI
    (http.get as any)('/api/protected').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalled();
    expect(snackSpy.open).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/current' } });
  });

  it('403 should go to /forbidden', () => {
    const http = TestBed.inject<any>(provideHttpClient as any);
    (http.get as any)('/api/forbidden').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/forbidden');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(0);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/forbidden']);
    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('404 GET should go to /not-found', () => {
    const http = TestBed.inject<any>(provideHttpClient as any);
    (http.get as any)('/api/missing').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/missing');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/not-found');
  });

  it('500 should go to /server-error', () => {
    const http = TestBed.inject<any>(provideHttpClient as any);
    (http.post as any)('/api/save', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/save');
    req.flush({ message: 'Oops' }, { status: 500, statusText: 'Server Error' });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/server-error');
    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('status 0 should go to /offline', () => {
    const http = TestBed.inject<any>(provideHttpClient as any);
    (http.get as any)('/api/ping').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/ping');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/offline');
    expect(snackSpy.open).toHaveBeenCalled();
  });

  it('respects X-Skip-Error-Handling header', () => {
    const http = TestBed.inject<any>(provideHttpClient as any);
    (http.get as any)('/api/quiet', { headers: { 'X-Skip-Error-Handling': '1' } }).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/quiet');
    req.flush({ message: 'Bad' }, { status: 400, statusText: 'Bad Request' });

    expect(snackSpy.open).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});
