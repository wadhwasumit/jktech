import { Component, OnInit, inject } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { User,UserRole } from '../../models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-list',
  imports: [ CommonModule,MatSpinner, RouterModule, MatMenuModule, MatDividerModule, MatIconModule,  MatCardModule, MatChipsModule, MatTableModule ],
  templateUrl: './users-list.component.html',
  styles: [`
    .list-container {
      padding: 24px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .table-card {
      margin-top: 16px;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .delete-action {
      color: #f44336;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'role', 'createdAt', 'isActive', 'actions'];
  isLoading = false;
  private usersService=inject(UsersService)
  private dialog= inject(MatDialog)
  private snackBar=inject(MatSnackBar)

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


  
  editUserRole(user: User): void {
    // Navigate to edit form or open dialog
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
