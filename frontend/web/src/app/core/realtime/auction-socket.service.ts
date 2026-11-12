import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface AuctionRealtimeEvent {
  type: 'bid.accepted' | 'bid.outbid' | 'auction.closed' | 'participants.updated' | 'connection.error';
  auctionId?: string;
  data?: Record<string, unknown>;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuctionSocketService {
  connectToAuction(auctionId: string, token: string): Observable<AuctionRealtimeEvent> {
    return new Observable<AuctionRealtimeEvent>(observer => {
      const socket: Socket = io(environment.socketUrl || window.location.origin, {
        path: '/socket.io',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000
      });

      socket.on('connected', () => socket.emit('authenticate', { token }));
      socket.on('authenticated', () => socket.emit('subscribe', { auctionId }));
      socket.on('subscribed', event => observer.next({
        type: 'participants.updated',
        data: { count: event?.participantCount ?? 0 }
      }));
      socket.on('bid.accepted', event => observer.next({ type: 'bid.accepted', ...event }));
      socket.on('bid.outbid', event => observer.next({ type: 'bid.outbid', ...event }));
      socket.on('auction.closed', event => observer.next({ type: 'auction.closed', ...event }));
      socket.on('participants.updated', event => observer.next({ type: 'participants.updated', ...event }));
      socket.on('error', event => observer.next({
        type: 'connection.error',
        message: typeof event?.message === 'string' ? event.message : 'Error en tiempo real.'
      }));
      socket.on('connect_error', () => observer.next({
        type: 'connection.error',
        message: 'No se pudo establecer conexión en tiempo real. Se intentará reconectar.'
      }));
      socket.on('disconnect', reason => {
        if (reason !== 'io client disconnect') {
          observer.next({ type: 'connection.error', message: 'Conexión en tiempo real interrumpida; reconectando…' });
        }
      });

      return () => {
        if (socket.connected) socket.emit('unsubscribe', { auctionId });
        socket.removeAllListeners();
        socket.disconnect();
      };
    });
  }
}
