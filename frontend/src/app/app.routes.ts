import { Routes } from '@angular/router';
import { AuthGuard } from './core/guard/auth.guard';
import { DocumentListComponent } from './components/documents/document-list/document-list.component';
import { DocumentUploadComponent } from './components/documents/document-upload/document-upload.component';
import { UserListComponent } from './components/users/users-list.component';
import { RoleGuard } from './core/guard/role.guard';
// import { UserFormComponent } from './components/users/user-form.component';
// import { DocumentUploadComponent } from './components/documents/document-upload/document-upload.component';


export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
    },
    { path: 'users', component: UserListComponent, title: 'Users', canActivate: [RoleGuard] ,data: { roles: ['ADMIN'] }},
    // { path: 'users/new', component: UserFormComponent, title: 'Create User' },
    // { path: 'users/:id/edit', component: UserFormComponent, title: 'Edit User' },
    {
        path: 'dashboard',
        component: DocumentListComponent,
        canActivate: [AuthGuard]
    },
    // {
    //     path: 'post-details/:id',
    //     loadComponent: () => import('./components/post-detail/post-detail.component').then(m => m.PostDetailComponent)
    // },
    {
    path: 'documents',
    component: DocumentListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'documents/upload',
    component: DocumentUploadComponent,
    canActivate: [AuthGuard],
    // data: { roles: [UserRole.ADMIN, UserRole.EDITOR] }
  },
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
    }
];
