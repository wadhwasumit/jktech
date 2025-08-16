import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '<p>Logging in...</p>',
})
export class AuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.authService.exchangeCodeForToken(params['code']);
      }
    });
  }
}
