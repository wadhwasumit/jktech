import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { UserRole } from '../../models/user.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  templateUrl: './update-role.component.html',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatInputModule
  ]
})
export class RoleDialogComponent {
  roles = [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER];
  selectedRole: UserRole;

  constructor(
    public dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role: UserRole }
  ) {
    this.selectedRole = data.role;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onUpdate() {
    this.dialogRef.close(this.selectedRole);
  }
}