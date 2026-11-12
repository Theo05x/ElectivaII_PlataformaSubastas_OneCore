import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { NotificationItem } from '../../core/api/api.models';
import { NotificationFacade } from './notification.facade';
import { toApiError } from '../../core/errors/api-error';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-notifications-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, NoticeComponent],
  template: `
    <main class="page-shell narrow-shell">
      <header class="page-heading"><p class="eyebrow">Lo importante, al día</p><h1>Notificaciones</h1>
        <p class="muted">Avisos relacionados con tus subastas y ofertas.</p></header>
      <div class="toolbar-end"><p-button label="Actualizar" icon="pi pi-refresh" [outlined]="true" (onClick)="load()" /></div>
      <oc-notice [message]="error" kind="error" />
      @if (loading) { <div class="loading-state"><i class="pi pi-spin pi-spinner"></i><span>Buscando novedades…</span></div> }
      @else if (items.length) {
        <section class="notification-list" aria-label="Notificaciones">
          @for (item of items; track item.id) {
            <article class="notification-item" [class.notification-unread]="!item.read">
              <span class="notification-icon"><i [class]="iconFor(item.type)"></i></span>
              <div class="notification-content"><div class="notification-top"><strong>{{ titleFor(item.type) }}</strong><time>{{ item.createdAt | date:'d MMM y, HH:mm':'':'es-CO' }}</time></div>
                <p>{{ item.message }}</p>
                <div class="notification-actions">
                  @if (item.auctionId) { <a [routerLink]="['/auctions', item.auctionId]" class="inline-link">Ver subasta <i class="pi pi-arrow-up-right"></i></a> }
                  @if (item.orderId) { <a [routerLink]="['/orders', item.orderId]" class="inline-link">Consultar orden <i class="pi pi-arrow-up-right"></i></a> }
                </div>
              </div>
            </article>
          }
        </section>
        <p class="read-note"><i class="pi pi-info-circle"></i> La API actual permite consultar avisos, pero no marcarlos como leídos.</p>
      } @else if (!error) {
        <section class="empty-state"><span class="empty-icon"><i class="pi pi-inbox"></i></span><h2>Sin notificaciones por ahora</h2>
          <p>Te avisaremos aquí cuando haya novedades en tus subastas.</p></section>
      }
    </main>
  `
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationFacade = inject(NotificationFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  items: NotificationItem[] = [];
  loading = true;
  error = '';
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = '';
    this.notificationFacade.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.items = result;
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

  iconFor(type: NotificationItem['type']): string {
    return type === 'BID_OUTBID' ? 'pi pi-arrow-up' : type === 'PAYMENT_CONFIRMED' ? 'pi pi-check-circle' :
      type === 'PAYMENT_EXPIRED' ? 'pi pi-clock' : type === 'AUCTION_WON' ? 'pi pi-trophy' : 'pi pi-bell';
  }

  titleFor(type: NotificationItem['type']): string {
    const labels: Record<NotificationItem['type'], string> = {
      BID_OUTBID: 'Tu oferta fue superada', AUCTION_WON: 'Ganaste una subasta',
      AUCTION_CLOSED: 'Subasta finalizada', PAYMENT_CONFIRMED: 'Pago confirmado',
      PAYMENT_EXPIRED: 'Plazo de pago vencido'
    };
    return labels[type];
  }
}
