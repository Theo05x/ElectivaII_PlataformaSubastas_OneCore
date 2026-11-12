import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { AuctionFacade } from './auction.facade';
import { AuctionDetails } from '../../core/api/api.models';
import { SessionService } from '../../core/auth/session.service';
import { AuctionRealtimeEvent, AuctionSocketService } from '../../core/realtime/auction-socket.service';
import { toApiError } from '../../core/errors/api-error';
import { BidHistoryComponent } from '../../shared/components/bid-history.component';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-auction-detail-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, ButtonModule, BidHistoryComponent, NoticeComponent],
  template: `
    <main class="page-shell detail-shell">
      <a routerLink="/auctions" class="back-link"><i class="pi pi-arrow-left"></i> Volver a subastas</a>
      <oc-notice [message]="error" kind="error" />
      <oc-notice [message]="notice" [kind]="noticeKind" />
      @if (loading) { <div class="loading-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando detalle…</span></div> }
      @else if (auction) {
        <div class="detail-heading">
          <div><p class="eyebrow">{{ auction.category }} <span class="divider-dot">·</span> {{ auction.article.conservationState }}</p>
            <h1>{{ auction.article.title }}</h1><p class="muted">Publicado por {{ auction.sellerId === userId ? 'ti' : ('usuario ' + auction.sellerId.slice(0, 8)) }}</p></div>
          <span class="status-chip large-chip" [class.status-live]="auction.status === 'OPEN'">{{ statusLabel }}</span>
        </div>
        <div class="detail-grid">
          <section class="panel item-panel">
            <p class="eyebrow">Sobre este artículo</p><p class="item-description">{{ auction.article.description }}</p>
            <div class="detail-facts"><div><span class="metric-label">Estado de conservación</span><strong>{{ auction.article.conservationState }}</strong></div>
              <div><span class="metric-label">Subasta finaliza</span><strong>{{ auction.endDate | date:'d MMMM y, HH:mm':'':'es-CO' }}</strong></div></div>
            <div class="live-line"><span class="pulse-dot" [class.pulse-off]="!realtimeConnected"></span>
              {{ realtimeConnected ? 'Actualización en vivo activa' : 'Conectando a actualizaciones en vivo…' }}
              <span class="participant-count"><i class="pi pi-users"></i> {{ participantCount }} en la subasta</span></div>
          </section>
          <aside class="panel bid-panel">
            <p class="eyebrow">Oferta vigente</p>
            <div class="current-price">{{ (auction.currentBidAmount ?? auction.basePrice) | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</div>
            <p class="muted">{{ auction.currentBidAmount ? 'La oferta más alta hasta ahora' : 'Precio base de la subasta' }}</p>
            <div class="minimum-note"><span>Incremento mínimo</span><strong>{{ auction.minimumIncrement | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</strong></div>
            @if (canBid) {
              <form class="form-stack bid-form" (ngSubmit)="placeBid()">
                <label for="bidAmount">Tu oferta en COP</label>
                <input id="bidAmount" pInputText type="number" [(ngModel)]="bidAmount" name="bidAmount"
                  [min]="minimumBid" [step]="auction.minimumIncrement" required>
                <small class="muted">Oferta mínima: {{ minimumBid | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</small>
                <p-button type="submit" [label]="bidBusy ? 'Enviando…' : 'Ofertar ahora'" icon="pi pi-arrow-up"
                  [disabled]="bidBusy || !bidAmount || bidAmount < minimumBid" styleClass="w-full submit-button" />
              </form>
            } @else if (isSeller && auction.status === 'OPEN' && !auction.currentBidAmount) {
              <p-button label="Cancelar subasta" icon="pi pi-times" [outlined]="true" severity="danger"
                [disabled]="cancelBusy" (onClick)="cancelAuction()" styleClass="w-full cancel-button" />
            } @else {
              <div class="closed-note"><i class="pi pi-lock"></i><span>{{ auction.status !== 'OPEN' ? 'Esta subasta ya no está abierta.' : 'No puedes ofertar en tu propia subasta.' }}</span></div>
            }
          </aside>
        </div>
        <oc-bid-history [bids]="auction.bidsHistory" />
      }
    </main>
  `
})
export class AuctionDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auctionsApi = inject(AuctionFacade);
  private readonly session = inject(SessionService);
  private readonly socketService = inject(AuctionSocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  auction: AuctionDetails | null = null;
  loading = true;
  bidBusy = false;
  cancelBusy = false;
  bidAmount: number | null = null;
  error = '';
  notice = '';
  noticeKind: 'info' | 'success' = 'info';
  participantCount = 0;
  realtimeConnected = false;
  private id = '';

  get userId(): string { return this.session.profile?.user.id ?? ''; }
  get isSeller(): boolean { return Boolean(this.auction && this.userId === this.auction.sellerId); }
  get minimumBid(): number {
    if (!this.auction) return 0;
    return this.auction.currentBidAmount === null ? this.auction.basePrice : this.auction.currentBidAmount + this.auction.minimumIncrement;
  }
  get canBid(): boolean { return Boolean(this.auction?.status === 'OPEN' && !this.isSeller); }
  get statusLabel(): string {
    const labels: Record<string, string> = { OPEN: 'Abierta', CLOSED: 'Cerrada', CANCELLED: 'Cancelada', DESIERTA: 'Sin ofertas', PAID: 'Pagada', DEFAULTED: 'Pago vencido' };
    return this.auction ? labels[this.auction.status] : '';
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.session.profile) this.load();
    else this.session.loadProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
      error: error => {
        this.error = toApiError(error).message;
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.auctionsApi.get(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.auction = result;
        this.loading = false;
        this.changeDetector.detectChanges();
        const token = this.session.token;
        if (token) this.socketService.connectToAuction(this.id, token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
          this.handleRealtime(event);
          this.changeDetector.detectChanges();
        });
      },
      error: error => {
        this.error = toApiError(error).message;
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  placeBid(): void {
    if (!this.auction || this.bidBusy || this.bidAmount === null) return;
    this.bidBusy = true; this.error = ''; this.notice = '';
    this.auctionsApi.placeBid(this.id, this.bidAmount).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (this.auction) {
          this.auction.currentBidAmount = result.amount;
          this.auction.currentBidderId = result.bidderId;
          this.auction.bidsHistory = [result, ...this.auction.bidsHistory];
        }
        this.noticeKind = 'success';
        this.notice = 'Tu oferta fue aceptada.';
        this.bidAmount = null;
        this.bidBusy = false;
        this.changeDetector.detectChanges();
      },
      error: error => {
        this.error = toApiError(error).message;
        this.bidBusy = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  cancelAuction(): void {
    if (!this.auction || !this.isSeller || this.auction.currentBidAmount !== null || !window.confirm('¿Quieres cancelar esta subasta?')) return;
    this.cancelBusy = true;
    this.auctionsApi.cancel(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (this.auction) this.auction.status = result.status;
        this.cancelBusy = false;
        this.changeDetector.detectChanges();
      },
      error: error => {
        this.error = toApiError(error).message;
        this.cancelBusy = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  private handleRealtime(event: AuctionRealtimeEvent): void {
    if (event.type === 'connection.error') { this.realtimeConnected = false; this.noticeKind = 'info'; this.notice = event.message ?? ''; return; }
    if (event.type === 'participants.updated') {
      this.participantCount = Number(event.data?.['count'] ?? 0);
      this.realtimeConnected = true;
      return;
    }
    if (!this.auction || (event.auctionId && event.auctionId !== this.id)) return;
    this.realtimeConnected = true;
    const data = event.data ?? {};
    if (event.type === 'bid.accepted') {
      const current = Number(data['currentBidAmount'] ?? data['amount']);
      if (Number.isFinite(current)) this.auction.currentBidAmount = current;
      this.noticeKind = 'info';
      this.notice = 'Se registró una nueva oferta.';
      this.auctionsApi.get(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => { this.auction = result; this.changeDetector.detectChanges(); },
        error: error => { this.error = toApiError(error).message; this.changeDetector.detectChanges(); }
      });
    } else if (event.type === 'bid.outbid') {
      this.noticeKind = 'info';
      this.notice = 'Tu oferta fue superada. Puedes presentar una nueva oferta.';
    } else if (event.type === 'auction.closed') {
      this.auction.status = String(data['status'] ?? 'CLOSED') as AuctionDetails['status'];
      this.auction.winnerId = typeof data['winnerId'] === 'string' ? data['winnerId'] : null;
      this.auction.winningBidAmount = typeof data['winningBidAmount'] === 'number' ? data['winningBidAmount'] : null;
      this.noticeKind = 'info';
      this.notice = 'La subasta ha cerrado.';
    }
  }
}
