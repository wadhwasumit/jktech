// src/app/components/users/users-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UserListComponent } from './users-list.component';
import { UsersService } from '../../services/users.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { User, UserRole } from '../../models/user.model';

describe('UserListComponent (Jest)', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;

  // Strongly-typed mocks so return types line up with the service.
  let mockUsersService: {
    list: jest.Mock<ReturnType<UsersService['list']>, Parameters<UsersService['list']>>;
    updateUserRole: jest.Mock<ReturnType<UsersService['updateUserRole']>, Parameters<UsersService['updateUserRole']>>;
    deleteUser: jest.Mock<ReturnType<UsersService['deleteUser']>, Parameters<UsersService['deleteUser']>>;
  };
  let mockDialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let mockRouter: jest.Mocked<Pick<Router, 'navigate'>>;

  const u1: User = {
    id: '1', name: 'Test', email: 't@x.com',
    role: UserRole.ADMIN, isActive: true, createdAt: '', updatedAt: ''
  };
  const u1Edited: User = { ...u1, role: UserRole.EDITOR };

  beforeEach(async () => {
    mockUsersService = {
      list: jest.fn(),
      updateUserRole: jest.fn(),
      deleteUser: jest.fn(),
    };

    mockDialog = { open: jest.fn() } as any;
    mockRouter = { navigate: jest.fn() } as any;

    await TestBed.configureTestingModule({
      imports: [
        UserListComponent,            // standalone component
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    mockUsersService.list.mockReturnValue(of([u1]));
    component.ngOnInit();
    expect(mockUsersService.list).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should show error on failed load', () => {
    mockUsersService.list.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
  });

  it('should open role dialog and update role', () => {
    // Dialog returns a UserRole (enum), not a string.
    const dialogRefMock = { afterClosed: () => of(UserRole.EDITOR) } as any;
    mockDialog.open.mockReturnValue(dialogRefMock);

    // updateUserRole must return Observable<User>
    mockUsersService.updateUserRole.mockReturnValue(of(u1Edited));

    component.openRoleDialog(u1);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith('1', UserRole.EDITOR);
  });

  it('should not update role if result is undefined or same', () => {
    const dialogRefMock = { afterClosed: () => of(undefined) } as any;
    mockDialog.open.mockReturnValue(dialogRefMock);

    component.openRoleDialog(u1);

    expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
  });

  it('should close role dialog', () => {
    component.selectedUser = u1;
    component.selectedRole = UserRole.EDITOR;
    component.showRoleDialog = true;

    component.closeRoleDialog();

    expect(component.selectedUser).toBeNull();
    expect(component.selectedRole).toBeNull();
    expect(component.showRoleDialog).toBe(false);
  });

  it('should update user role using updateUserRole()', () => {
    component.selectedUser = u1;
    component.selectedRole = UserRole.EDITOR;

    mockUsersService.updateUserRole.mockReturnValue(of(u1Edited));

    component.updateUserRole();

    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith('1', UserRole.EDITOR);
  });

  it('should not update user role if selectedUser or selectedRole is missing', () => {
    component.selectedUser = null;
    component.selectedRole = null;

    component.updateUserRole();

    expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
  });

  it('should delete user', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    // deleteUser must return Observable<void>
    mockUsersService.deleteUser.mockReturnValue(of(void 0));

    component.users = [u1];
    component.deleteUser(u1);

    expect(mockUsersService.deleteUser).toHaveBeenCalledWith('1');
  });

  it('should not delete user if confirm is false', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    component.users = [u1];
    component.deleteUser(u1);

    expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
  });
});
