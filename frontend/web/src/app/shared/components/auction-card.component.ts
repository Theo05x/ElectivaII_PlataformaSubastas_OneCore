import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Auction } from '../../core/api/api.models';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'oc-auction-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ButtonModule],
  template: `
    <article class="auction-card">
      <div class="card-top">
        <span class="eyebrow">{{ auction.category }}</span>
        <span class="status-chip" [class.status-live]="auction.status === 'OPEN'">{{ statusLabel }}</span>
      </div>
      <h3>{{ auction.article.title }}</h3>
      <p class="muted description">{{ auction.article.description }}</p>
      <div class="card-metrics">
        <div><span class="metric-label">{{ auction.currentBidAmount ? 'Oferta actual' : 'Precio base' }}</span>
          <strong>{{ (auction.currentBidAmount ?? auction.basePrice) | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</strong>
        </div>
        <div class="align-end"><span class="metric-label">Cierre</span><strong>{{ auction.endDate | date:'d MMM, HH:mm':'':'es-CO' }}</strong></div>
      </div>
      <p-button label="Ver subasta" icon="pi pi-arrow-up-right" iconPos="right" [text]="true"
        styleClass="card-link" (onClick)="selected.emit(auction.id)" />
    </article>
  `
})
export class AuctionCardComponent {
  @Input({ required: true }) auction!: Auction;
  @Output() selected = new EventEmitter<string>();
  get statusLabel(): string { return this.auction.status === 'OPEN' ? 'Abierta' : this.auction.status; }
}
