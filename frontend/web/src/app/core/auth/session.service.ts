import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiClient } from '../api/api-client.service';
import { UserProfile } from '../api/api.models';

const TOKEN_KEY = 'onecore.session.token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiClient);
  private readonly profileSubject = new BehaviorSubject<UserProfile | null>(null);
  private profileRequest$: Observable<UserProfile> | null = null;
  readonly profile$ = this.profileSubject.asObservable();

  constructor() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  }

  get token(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
  }

  get profile(): UserProfile | null {
    return this.profileSubject.value;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  establish(token: string): void {
    this.profileRequest$ = null;
    this.profileSubject.next(null);
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  loadProfile(): Observable<UserProfile> {
    if (this.profileSubject.value) return of(this.profileSubject.value);
    if (!this.profileRequest$) {
      this.profileRequest$ = this.api.me().pipe(
        map(response => response.data),
        tap(profile => this.profileSubject.next(profile)),
        catchError(error => {
          this.profileRequest$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.profileRequest$;
  }

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.profileRequest$ = null;
    this.profileSubject.next(null);
  }
}
