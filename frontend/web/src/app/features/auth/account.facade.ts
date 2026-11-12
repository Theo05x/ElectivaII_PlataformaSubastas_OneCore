import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';
import { ApiClient } from '../../core/api/api-client.service';
import { Auction, UserProfile } from '../../core/api/api.models';
import { SessionService } from '../../core/auth/session.service';

@Injectable({ providedIn: 'root' })
export class AccountFacade {
  private readonly api = inject(ApiClient);
  private readonly session = inject(SessionService);

  register(name: string, email: string, password: string): Observable<{id: string; name: string; email: string}> {
    return this.api.register(name, email, password).pipe(map(response => response.data));
  }

  login(email: string, password: string): Observable<UserProfile> {
    return this.api.login(email, password).pipe(
      tap(response => this.session.establish(response.data.token)),
      switchMap(() => this.session.loadProfile())
    );
  }

  myActivity(): Observable<UserProfile> {
    return this.session.loadProfile();
  }
}
