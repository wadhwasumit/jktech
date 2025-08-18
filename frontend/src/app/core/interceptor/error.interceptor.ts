// src/app/core/http/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Opt out: add header { 'X-Skip-Error-Handling': '1' } on specific requests
    const skip = req.headers.get('X-Skip-Error-Handling') === '1';

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (skip) return throwError(() => error);

        const message = this.extractMessage(error);

        switch (error.status) {
          case 0: // Network / CORS / offline
            this.snack('Network error. Check your connection and try again.');
            // this.safeNavigate('/offline');
            break;

          case 400:
            // Bad Request (often validation errors)
            this.snack(message || 'Invalid request. Please review your input.');
            break;

          case 401:
            // Unauthorized: expire session and go to login
            this.authService.logout();
            this.snack('Your session has expired. Please sign in again.');
            this.safeNavigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
            break;

          case 403:
            // Forbidden
            this.snack('You do not have permission to perform this action.');
            this.safeNavigate('/forbidden');
            break;

          case 404:
            // Not found (only redirect on GETs; otherwise, just show a toast)
            if (req.method === 'GET') {
              this.safeNavigate('/not-found');
            } else {
              this.snack(message || 'Resource not found.');
            }
            break;

          case 409:
            // Conflict
            this.snack(message || 'Conflict detected. Please refresh and try again.');
            break;

          case 422:
            // Unprocessable Entity (field validation)
            this.snack(message || 'Some fields are invalid. Please check and try again.');
            break;

          case 429:
            // Too Many Requests / rate limited
            this.snack('Too many requests. Please wait a moment and try again.');
            break;

          default:
            if (error.status >= 500) {
              // Server errors
              this.snack(message || 'A server error occurred. Please try again later.');
              // this.safeNavigate('/server-error');
            } else {
              // Everything else
              this.snack(message || 'An unexpected error occurred.');
            }
            break;
        }

        return throwError(() => error);
      })
    );
  }

  private extractMessage(err: HttpErrorResponse): string {
    // Handle common backend shapes:
    // { message: string } | { errors: string[] | { msg/message }[] } | string
    const e = err.error;
    if (!e) return err.message || 'An error occurred';

    if (typeof e === 'string') return e;

    if (typeof e.message === 'string') return e.message;

    if (Array.isArray(e.errors)) {
      const parts = e.errors
        .map((x: any) =>
          typeof x === 'string' ? x : x?.msg ?? x?.message ?? ''
        )
        .filter(Boolean);
      if (parts.length) return parts.join('\n');
    }

    // Fallback to status text / generic
    return err.message || 'An error occurred';
  }

  private snack(message: string, action = 'Close', duration = 5000) {
    this.snackBar.open(message, action, { duration, panelClass: ['snack-error'] });
  }

  private safeNavigate(commands: any[] | string, extras?: any) {
    // Avoid NavigationCancel errors if already on target route
    try {
      if (Array.isArray(commands)) {
        this.router.navigate(commands as any, extras);
      } else {
        this.router.navigateByUrl(commands as string, extras);
      }
    } catch {
      // no-op
    }
  }
}
