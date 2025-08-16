import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
@Component({
  selector: 'app-login',
  imports: [MatDividerModule, MatIconModule, MatCardModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  loginWithGoogle() {
    this.authService.googleLogin();
  }

  onGoogleLogin() {
    console.log('Google login clicked');
  }

  onFacebookLogin() {
    console.log('Facebook login clicked');
  }
}
