import { Component, Input } from '@angular/core';
import { DatePipe, CurrencyPipe, SlicePipe } from '@angular/common';
import { Bid } from '../../core/api/api.models';

@Component({
  selector: 'oc-bid-history',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, SlicePipe],
  template: `
    <section class="panel">
      <div class="section-heading"><div><p class="eyebrow">Actividad</p><h2>Historial de ofertas</h2></div>
        <span class="count">{{ bids.length }}</span></div>
      @if (bids.length) {
        <ol class="bid-list">
          @for (bid of bids; track bid.id) {
            <li><span class="bid-dot"></span><div class="bid-meta"><strong>{{ bid.amount | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}</strong>
              <span class="muted">Postor {{ bid.bidderId | slice:0:8 }} · {{ bid.placedAt | date:'d MMM, HH:mm':'':'es-CO' }}</span></div></li>
          }
        </ol>
      } @else { <p class="muted empty-inline">Todavía no hay ofertas. ¡Puedes ser la primera persona en participar!</p> }
    </section>
  `
})
export class BidHistoryComponent {
  @Input() bids: Bid[] = [];
}
