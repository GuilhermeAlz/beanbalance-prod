import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import { AppStateService } from './app-state.service';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiration: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  private storage = inject(AuthStorageService);
  private state = inject(AppStateService);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/api/auth/login`, { email, password })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/api/auth/register`, { username, email, password })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  refresh(accessToken: string, refreshToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/api/auth/refresh`, { accessToken, refreshToken })
      .pipe(tap(res => this.storage.setTokens(res.accessToken, res.refreshToken, res.username)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.authApiUrl}/api/auth/revoke`, {})
      .pipe(
        finalize(() => {
          this.storage.clearTokens();
          this.state.logout();
        }),
      );
  }

  private handleAuthSuccess(res: AuthResponse): void {
    this.storage.setTokens(res.accessToken, res.refreshToken, res.username);
    this.state.login(res.username);
  }
}
