import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleDialogComponent } from './update-role.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('RoleDialogComponent', () => {
  let component: RoleDialogComponent;
  let fixture: ComponentFixture<RoleDialogComponent>;
  let dialogRefMock: any;

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() };

    TestBed.configureTestingModule({
      imports: [RoleDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { role: 'admin' } }
      ]
    });

    fixture = TestBed.createComponent(RoleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selectedRole from data', () => {
    expect(component.selectedRole).toBe('admin');
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('should close dialog with selectedRole on update', () => {
    component.selectedRole = 'editor';
    component.onUpdate();
    expect(dialogRefMock.close).toHaveBeenCalledWith('editor');
  });
});