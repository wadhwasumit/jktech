import { Injectable } from '@angular/core';

type RuntimeEnv = {
  API_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CALLBACK_URL?: string;
};

@Injectable({ providedIn: 'root' })
export class EnvService {
  private get env(): RuntimeEnv { return (window as any).__env || {}; }

  readonly apiUrl = this.env.API_URL ?? 'http://localhost:3000';
  readonly googleClientId = this.env.GOOGLE_CLIENT_ID ?? '';
  readonly googleCallbackUrl = this.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4200/auth/callback';
}
