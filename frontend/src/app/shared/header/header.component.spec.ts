// header.component.spec.ts (Jest)
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../auth/service/auth.service';

describe('HeaderComponent (Jest)', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  const authMock = {
    isAuthenticated: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
    hasAnyRole: jest.fn().mockReturnValue(true), // <-- add this
  } as unknown as AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('logout() should call AuthService.logout()', () => {
    component.logout();
    expect((authMock as any).logout).toHaveBeenCalled();
  });
});
