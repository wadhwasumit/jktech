import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  from = this.route.snapshot.queryParamMap.get('from') ?? '';
  // ✅ add parentheses to avoid the mixing error
  returnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') ?? this.from) || '/';

  dashboardLink = '/dashboard';
  attemptedPath = computed(() => this.from || this.router.url);
}
