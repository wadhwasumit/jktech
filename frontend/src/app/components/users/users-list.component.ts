import { Component, OnInit, inject } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { User, UserRole } from '../../models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoleDialogComponent } from './update-role.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MatMenuModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'role', 'createdAt', 'isActive', 'actions'];
  isLoading = false;
  private dialog = inject(MatDialog);
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  roles: UserRole[] = [UserRole.ADMIN,UserRole.EDITOR,UserRole.VIEWER]; // Adjust as needed
  selectedUser: User | null = null;
  selectedRole: UserRole | null = null;
  showRoleDialog = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService.list().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 5000 });
      }
    });
  }

  openRoleDialog(user: User) {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '400px',
      data: { role: user.role }
    });

    dialogRef.afterClosed().subscribe((result: UserRole | undefined) => {
      if (result && result !== user.role) {
        this.usersService.updateUserRole(user.id, result).subscribe({
          next: () => {
            user.role = result;
            this.snackBar.open('Role updated', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to update role', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }
  // ...existing code...

  closeRoleDialog() {
    this.selectedUser = null;
    this.selectedRole = null;
    this.showRoleDialog = false;
  }

  updateUserRole() {
    if (!this.selectedUser || !this.selectedRole) return;
    this.usersService.updateUserRole(this.selectedUser.id, this.selectedRole).subscribe({
      next: () => {
        this.selectedUser!.role = this.selectedRole!;
        this.closeRoleDialog();
        this.snackBar.open('Role updated', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update role', 'Close', { duration: 5000 });
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete User', 'Close', { duration: 5000 });
        }
      });
    }
  }
}