// src/app/services/users.service.spec.ts
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { UsersService } from './users.service';
import { EnvService } from '../env.service';
import { User, UserRole } from '../models/user.model';

describe('UsersService (Jest)', () => {
  let service: UsersService;
  let http: HttpTestingController;

  const envMock: Partial<EnvService> = { apiUrl: 'http://localhost/api' };
  const base = `${envMock.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Provide the real HttpClient (functional providers)
        // If you have interceptors registered via DI, keep withInterceptorsFromDi()
        provideHttpClient(withInterceptorsFromDi()),
        // Swap in the testing backend AFTER provideHttpClient
        provideHttpClientTesting(),

        UsersService,
        { provide: EnvService, useValue: envMock },
      ],
    });

    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify(); // make sure there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() should GET all users', () => {
    const mock: User[] = [
      { id: '1', name: 'A', email: 'a@x.com', role: UserRole.EDITOR, isActive: true,  createdAt: '', updatedAt: '' },
      { id: '2', name: 'B', email: 'b@x.com', role: UserRole.ADMIN,  isActive: true,  createdAt: '', updatedAt: '' },
    ];

    let result: User[] | undefined;
    service.list().subscribe(r => (result = r));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('get() should GET a user by id', () => {
    const mock: User = {
      id: '42', name: 'Zoe', email: 'z@x.com',
      role: UserRole.VIEWER, isActive: true, createdAt: '', updatedAt: ''
    };

    let result: User | undefined;
    service.get('42').subscribe(r => (result = r));

    const req = http.expectOne(`${base}/42`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('create() should POST payload and return created user', () => {
    const payload = { email: 'n@x.com', name: 'New', role: UserRole.VIEWER, password: 'secret' };
    const mock: User = {
      id: 'n1', name: 'New', email: 'n@x.com',
      role: UserRole.VIEWER, isActive: true, createdAt: '', updatedAt: ''
    };

    let result: User | undefined;
    service.create(payload).subscribe(r => (result = r));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mock);

    expect(result).toEqual(mock);
  });
});
