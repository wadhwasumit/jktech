import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { PostStoreEffects } from './post-store/effects';
import { reducer } from './post-store/reducer';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptor/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor])), provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideStore({ posts: reducer }), provideEffects([PostStoreEffects])]
};
