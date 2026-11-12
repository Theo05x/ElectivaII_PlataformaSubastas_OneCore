import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../core/api/api-client.service';
import { NotificationItem } from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationFacade {
  private readonly api = inject(ApiClient);
  list(): Observable<NotificationItem[]> {
    return this.api.notifications().pipe(map(response => response.data));
  }
}
