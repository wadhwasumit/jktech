import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './users-list.component';
import { UsersService } from '../../services/users.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUsersService: any;
  let mockDialog: any;

  beforeEach(() => {
    mockUsersService = {
      list: jest.fn(),
      updateUserRole: jest.fn(),
      deleteUser: jest.fn()
    };
    mockDialog = {
      open: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [UserListComponent, MatSnackBarModule],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    });

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    mockUsersService.list.mockReturnValue(of([{ id: '1', name: 'Test', role: 'admin' }]));
    component.ngOnInit();
    expect(component.users.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should show error on failed load', () => {
    mockUsersService.list.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
  });

  it('should open role dialog and update role', () => {
    const user = { id: '1', name: 'Test', role: 'admin' };
    const dialogRefMock = { afterClosed: () => of('editor') };
    mockDialog.open.mockReturnValue(dialogRefMock);
    mockUsersService.updateUserRole.mockReturnValue(of({}));

    component.openRoleDialog(user as any);
    expect(mockDialog.open).toHaveBeenCalled();

    // Simulate dialog result and role update
    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith('1', 'editor');
  });

  it('should not update role if result is undefined or same', () => {
    const user = { id: '1', name: 'Test', role: 'admin' };
    const dialogRefMock = { afterClosed: () => of(undefined) };
    mockDialog.open.mockReturnValue(dialogRefMock);

    component.openRoleDialog(user as any);
    expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
  });

  it('should close role dialog', () => {
    component.selectedUser = { id: '1', name: 'Test', role: 'admin' } as any;
    component.selectedRole = 'editor';
    component.showRoleDialog = true;
    component.closeRoleDialog();
    expect(component.selectedUser).toBeNull();
    expect(component.selectedRole).toBeNull();
    expect(component.showRoleDialog).toBe(false);
  });

  it('should update user role using updateUserRole()', () => {
    component.selectedUser = { id: '1', name: 'Test', role: 'admin' } as any;
    component.selectedRole = 'editor';
    mockUsersService.updateUserRole.mockReturnValue(of({}));
    component.updateUserRole();
    expect(mockUsersService.updateUserRole).toHaveBeenCalledWith('1', 'editor');
  });

  it('should not update user role if selectedUser or selectedRole is missing', () => {
    component.selectedUser = null;
    component.selectedRole = null;
    component.updateUserRole();
    expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
  });

  it('should delete user', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockUsersService.deleteUser.mockReturnValue(of({}));
    component.users = [{ id: '1', name: 'Test', role: 'admin' } as any];
    component.deleteUser(component.users[0]);
    expect(mockUsersService.deleteUser).toHaveBeenCalledWith('1');
  });

  it('should not delete user if confirm is false', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    component.users = [{ id: '1', name: 'Test', role: 'admin' } as any];
    component.deleteUser(component.users[0]);
    expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
  });
});