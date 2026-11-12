import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaymentOrder } from '../../core/api/api.models';
import { PaymentFacade } from './payment.facade';
import { toApiError } from '../../core/errors/api-error';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-order-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, ButtonModule, InputTextModule, NoticeComponent],
  template: `
    <main class="page-shell narrow-shell">
      <a routerLink="/notifications" class="back-link"><i class="pi pi-arrow-left"></i> Volver a notificaciones</a>
      <header class="page-heading"><p class="eyebrow">Consulta puntual</p><h1>Orden de pago</h1>
        <p class="muted">Consulta una orden propia con el identificador recibido en una notificación.</p></header>
      <oc-notice [message]="error" kind="error" />
      @if (!order) {
        <section class="panel order-lookup">
          <form class="lookup-form" (ngSubmit)="lookup()"><label for="orderId">Identificador de la orden</label>
            <input id="orderId" pInputText [(ngModel)]="orderId" name="orderId" required autocomplete="off">
            <p-button type="submit" label="Consultar orden" icon="pi pi-search" [disabled]="loading || !orderId.trim()" />
          </form>
          <p class="read-note"><i class="pi pi-shield"></i> Solo la persona ganadora puede consultar su orden.</p>
        </section>
      } @else {
        <section class="panel order-card">
          <div class="order-status"><span class="status-chip" [class.status-live]="order.status === 'PENDING'">{{ order.status === 'PENDING' ? 'Pendiente' : order.status === 'PAID' ? 'Pagada' : 'Vencida' }}</span>
            <span class="eyebrow">ID {{ order.id }}</span></div>
          <p class="eyebrow">Total de la orden</p><strong class="order-amount">{{ order.amount | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</strong>
          <div class="order-facts"><div><span class="metric-label">Subasta</span><a [routerLink]="['/auctions', order.auctionId]">{{ order.auctionId }}</a></div>
            <div><span class="metric-label">Vence</span><strong>{{ order.expirationDate | date:'d MMMM y, HH:mm':'':'es-CO' }}</strong></div>
            <div><span class="metric-label">Transacción</span><strong>{{ order.transactionId || 'Aún no reportada' }}</strong></div></div>
          @if (order.status === 'PENDING') {
            <div class="payment-limit"><i class="pi pi-info-circle"></i><p>El pago se confirma mediante una notificación servidor a servidor al backend. Esta interfaz académica no captura datos financieros ni procesa pagos.</p></div>
          }
          @if (order.status === 'PAID') { <p class="paid-message"><i class="pi pi-check-circle"></i> El backend confirmó el pago de esta orden.</p> }
          <p-button label="Consultar otra orden" [text]="true" (onClick)="order = null; orderId = ''" />
        </section>
      }
    </main>
  `
})
export class OrderPageComponent implements OnInit {
  private readonly paymentFacade = inject(PaymentFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  orderId = '';
  order: PaymentOrder | null = null;
  loading = false;
  error = '';
  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.orderId) this.lookup();
  }
  lookup(): void {
    const id = this.orderId.trim();
    if (!id) return;
    this.loading = true; this.error = ''; this.order = null;
    this.paymentFacade.getOrder(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.order = result;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: error => {
        this.error = toApiError(error).message;
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }
}
