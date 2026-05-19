import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppStateService } from '../services/app-state.service';
import { AuthApiService } from '../services/auth-api.service';
import { AuthStorageService } from '../services/auth-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(AuthStorageService);
  const authApi = inject(AuthApiService);
  const state = inject(AppStateService);
  const router = inject(Router);

  const addBearer = (r: typeof req, token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  // Attach token to requests targeting either backend
  const isOwnApi = (url: string) =>
    url.startsWith(environment.apiUrl) || url.startsWith(environment.authApiUrl);

  const token = storage.getAccessToken();
  const outgoing = token && isOwnApi(req.url) ? addBearer(req, token) : req;

  return next(outgoing).pipe(
    catchError(err => {
      // Only attempt refresh for Spring Boot API 401s (not auth MS calls)
      if (err.status !== 401 || req.url.includes('/api/auth/')) {
        return throwError(() => err);
      }

      const accessToken = storage.getAccessToken();
      const refreshToken = storage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        storage.clearTokens();
        state.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      return authApi.refresh(accessToken, refreshToken).pipe(
        switchMap(res => next(addBearer(req, res.accessToken))),
        catchError(refreshErr => {
          storage.clearTokens();
          state.logout();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
