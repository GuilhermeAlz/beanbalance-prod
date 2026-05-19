import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'bb_access_token';
const REFRESH_TOKEN_KEY = 'bb_refresh_token';
const USERNAME_KEY = 'bb_username';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  }

  setTokens(accessToken: string, refreshToken: string, username: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USERNAME_KEY, username);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }

  hasTokens(): boolean {
    return !!this.getAccessToken();
  }
}
