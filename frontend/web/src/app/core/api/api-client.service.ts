import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiEnvelope, Auction, AuctionDetails, Bid, NotificationItem, PageEnvelope,
  PaymentOrder, UserProfile
} from './api.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  register(name: string, email: string, password: string): Observable<ApiEnvelope<{id: string; name: string; email: string}>> {
    return this.http.post<ApiEnvelope<{id: string; name: string; email: string}>>(`${this.base}/users`, { name, email, password });
  }

  login(email: string, password: string): Observable<ApiEnvelope<{token: string}>> {
    return this.http.post<ApiEnvelope<{token: string}>>(`${this.base}/sessions`, { email, password });
  }

  me(): Observable<ApiEnvelope<UserProfile>> {
    return this.http.get<ApiEnvelope<UserProfile>>(`${this.base}/users/me`);
  }

  categories(): Observable<ApiEnvelope<string[]>> {
    return this.http.get<ApiEnvelope<string[]>>(`${this.base}/auctions/categories`);
  }

  auctions(query: {page: number; limit: number; status?: string; category?: string}): Observable<PageEnvelope<Auction[]>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.status) params = params.set('status', query.status);
    if (query.category) params = params.set('category', query.category);
    return this.http.get<PageEnvelope<Auction[]>>(`${this.base}/auctions`, { params });
  }

  auction(id: string): Observable<ApiEnvelope<AuctionDetails>> {
    return this.http.get<ApiEnvelope<AuctionDetails>>(`${this.base}/auctions/${encodeURIComponent(id)}`);
  }

  createAuction(input: {
    article: {title: string; description: string; conservationState: string};
    category: string; basePrice: number; minimumIncrement: number; endDate: string;
  }): Observable<ApiEnvelope<Auction>> {
    return this.http.post<ApiEnvelope<Auction>>(`${this.base}/auctions`, input);
  }

  bid(id: string, amount: number): Observable<ApiEnvelope<Bid>> {
    return this.http.post<ApiEnvelope<Bid>>(`${this.base}/auctions/${encodeURIComponent(id)}/bids`, { amount });
  }

  cancelAuction(id: string): Observable<ApiEnvelope<Auction>> {
    return this.http.patch<ApiEnvelope<Auction>>(`${this.base}/auctions/${encodeURIComponent(id)}`, { status: 'CANCELLED' });
  }

  notifications(): Observable<ApiEnvelope<NotificationItem[]>> {
    return this.http.get<ApiEnvelope<NotificationItem[]>>(`${this.base}/notifications`);
  }

  paymentOrder(id: string): Observable<ApiEnvelope<PaymentOrder>> {
    return this.http.get<ApiEnvelope<PaymentOrder>>(`${this.base}/payment-orders/${encodeURIComponent(id)}`);
  }
}
