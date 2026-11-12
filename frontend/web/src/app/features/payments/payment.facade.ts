import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../core/api/api-client.service';
import { PaymentOrder } from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class PaymentFacade {
  private readonly api = inject(ApiClient);
  getOrder(id: string): Observable<PaymentOrder> {
    return this.api.paymentOrder(id).pipe(map(response => response.data));
  }
}
