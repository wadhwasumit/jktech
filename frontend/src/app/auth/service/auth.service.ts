import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { EnvService } from '../../env.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router,private env: EnvService) { }

  googleLogin() {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/auth';
    const params = new HttpParams()
      .set('client_id',  this.env.googleClientId)
      .set('redirect_uri',  this.env.googleCallbackUrl)
      .set('response_type', 'code')
      .set('scope', 'email profile')
    window.location.href = `${googleAuthUrl}?${params.toString()}`;
  }

  exchangeCodeForToken(code: string) {
    this.http
      .post(`${this.env.apiUrl}/auth/google`, { code })
      .subscribe((res: any) => {
        sessionStorage.setItem('jwt', res.access_token);
        sessionStorage.setItem('userId', res.id)
        sessionStorage.setItem('role', res.role)
        this.router.navigate(['/dashboard']); // Redirect after login
      });
  }

  logout() {
    // ✅ Remove stored JWT token
    sessionStorage.clear(); // or sessionStorage.removeItem('token');

    // ✅ Redirect to login page
    this.router.navigate(['/auth/login']);
  }
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('jwt');
  }

  isSelfUser(id: string){
    return id === sessionStorage.getItem('userId');

  }
  hasAnyRole(roles: string[]): boolean {
    const userRole = sessionStorage.getItem('role');
    if (!userRole) return false;    
    return roles.includes(userRole);
  }
}
