import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AccessPageComponent } from './features/auth/access-page.component';
import { AuctionDetailPageComponent } from './features/auctions/auction-detail-page.component';
import { CatalogPageComponent } from './features/auctions/catalog-page.component';
import { PublishPageComponent } from './features/auctions/publish-page.component';
import { NotificationsPageComponent } from './features/notifications/notifications-page.component';
import { OrderPageComponent } from './features/payments/order-page.component';
import { ProfilePageComponent } from './features/profile/profile-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auctions' },
  { path: 'access', component: AccessPageComponent },
  { path: 'auctions', component: CatalogPageComponent },
  { path: 'auctions/new', component: PublishPageComponent, canActivate: [authGuard] },
  { path: 'auctions/:id', component: AuctionDetailPageComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsPageComponent, canActivate: [authGuard] },
  { path: 'orders/:id', component: OrderPageComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrderPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'auctions' }
];
