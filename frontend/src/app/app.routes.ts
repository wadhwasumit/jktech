import { Routes } from '@angular/router';
import { AuthGuard } from './core/guard/auth.guard';
import { RoleGuard } from './core/guard/role.guard';

export const routes: Routes = [
  // Auth feature (already lazy)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },

  // Public error pages (lazy standalone)
  {
    path: 'forbidden',
    title: 'Forbidden',
    loadComponent: () =>
      import('./core/errors/forbidden.component').then(m => m.ForbiddenComponent),
  },
  {
    path: 'not-found',
    title: 'Not Found',
    loadComponent: () =>
      import('./core/errors/not-found.component').then(m => m.NotFoundComponent),
  },
  {
  path: 'users',
  title: 'Users',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['admin'] },
  loadComponent: () =>
    import('./components/users/users-list.component')
      .then(m => m.UserListComponent),
},
{
  path: 'dashboard',
  title: 'Dashboard',
  canActivate: [AuthGuard],
  loadComponent: () =>
    import('./components/documents/document-list/document-list.component')
      .then(m => m.DocumentListComponent),
},
{
  path: 'documents',
  canActivate: [AuthGuard],
  children: [
    {
      path: '',
      title: 'Documents',
      loadComponent: () =>
        import('./components/documents/document-list/document-list.component')
          .then(m => m.DocumentListComponent),
    },
    {
      path: 'upload',
      title: 'Upload Document',
      loadComponent: () =>
        import('./components/documents/document-upload/document-upload.component')
          .then(m => m.DocumentUploadComponent),
    },
  ],
},
{
  path: 'ingestion',
  title: 'Ingestion Manager',
  canActivate: [AuthGuard],
  loadComponent: () =>
    import('./components/ingestion/ingestion-manager.component')
      .then(m => m.IngestionManagerComponent),
},


  // Defaults & fallback
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'not-found' },
];
