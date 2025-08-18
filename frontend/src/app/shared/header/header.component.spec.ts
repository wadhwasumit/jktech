import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../auth/service/auth.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  // Jasmine spy for AuthService
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'logout']);
    authMock.isAuthenticated.and.returnValue(true); // default for most tests

    await TestBed.configureTestingModule({
      // ✅ If HeaderComponent is standalone, just import it:
      imports: [HeaderComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize isLoggedIn from AuthService (true)', () => {
    // set in beforeEach
    expect(authMock.isAuthenticated).toHaveBeenCalled();
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should initialize isLoggedIn from AuthService (false)', () => {
    // Create a new instance with a different return value
    authMock.isAuthenticated.and.returnValue(false);
    const fx = TestBed.createComponent(HeaderComponent);
    const cmp = fx.componentInstance;
    fx.detectChanges();

    expect(authMock.isAuthenticated).toHaveBeenCalled();
    expect(cmp.isLoggedIn).toBeFalse();
  });

  it('logout() should call AuthService.logout()', () => {
    component.logout();
    expect(authMock.logout).toHaveBeenCalled();
  });
});
