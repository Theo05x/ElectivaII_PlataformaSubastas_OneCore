import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.token;
  const isApiRequest = request.url.startsWith('/api/v1/');
  const outgoing = isApiRequest
    ? request.clone({
      setHeaders: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    : request;
  const response = next(outgoing);
  const boundedResponse = isApiRequest
    ? response.pipe(timeout({ each: 15_000 }))
    : response;
  return boundedResponse.pipe(catchError(error => {
    if (isApiRequest && error.status === 401) {
      session.clear();
      if (!router.url.startsWith('/access')) void router.navigate(['/access']);
    }
    return throwError(() => error);
  }));
};
