import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../core/api/api-client.service';
import { Auction, AuctionDetails, Bid } from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class AuctionFacade {
  private readonly api = inject(ApiClient);

  categories(): Observable<string[]> {
    return this.api.categories().pipe(map(response => response.data));
  }

  list(filters: {page: number; limit: number; status?: string; category?: string}): Observable<{auctions: Auction[]; page: number; results: number}> {
    return this.api.auctions(filters).pipe(map(response => ({
      auctions: response.data, page: response.pagination.page, results: response.pagination.results
    })));
  }

  get(id: string): Observable<AuctionDetails> {
    return this.api.auction(id).pipe(map(response => response.data));
  }

  publish(input: {
    article: {title: string; description: string; conservationState: string};
    category: string; basePrice: number; minimumIncrement: number; endDate: string;
  }): Observable<Auction> {
    return this.api.createAuction(input).pipe(map(response => response.data));
  }

  placeBid(id: string, amount: number): Observable<Bid> {
    return this.api.bid(id, amount).pipe(map(response => response.data));
  }

  cancel(id: string): Observable<Auction> {
    return this.api.cancelAuction(id).pipe(map(response => response.data));
  }
}
