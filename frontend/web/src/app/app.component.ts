import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { SessionService } from './core/auth/session.service';

@Component({
  selector: 'oc-root',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, ButtonModule],
  template: `
    @if (showNavigation) {
      <header class="site-header">
        <div class="nav-inner">
          <a class="brand" routerLink="/auctions" aria-label="OneCore, inicio"><span class="brand-mark"><i class="pi pi-bolt"></i></span> OneCore</a>
          <nav class="primary-nav" aria-label="Navegación principal">
            <a routerLink="/auctions" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}">Explorar</a>
            @if (authenticated) {
              <a routerLink="/auctions/new" routerLinkActive="nav-active">Publicar</a>
              <a routerLink="/notifications" routerLinkActive="nav-active">Avisos</a>
            }
          </nav>
          <div class="account-nav">
            @if (session.profile$ | async; as profile) {
              <a routerLink="/profile" class="user-link"><span class="avatar avatar-small">{{ profile.user.name.slice(0, 1).toUpperCase() }}</span><span>{{ profile.user.name }}</span></a>
              <button type="button" class="logout-button" (click)="logout()"><i class="pi pi-sign-out"></i><span>Cerrar sesión</span></button>
            } @else if (authenticated) {
              <button type="button" class="logout-button" (click)="logout()"><i class="pi pi-sign-out"></i><span>Cerrar sesión</span></button>
            } @else {
              <a routerLink="/access" class="access-link">Entrar <i class="pi pi-arrow-up-right"></i></a>
            }
          </div>
          <button type="button" class="mobile-menu" aria-label="Ir a subastas" routerLink="/auctions"><i class="pi pi-compass"></i></button>
        </div>
      </header>
    }
    <router-outlet />
    <footer class="site-footer"><span>OneCore <span class="footer-divider">/</span> Subastas de comunidad</span><span>Proyecto académico · Entrega 3</span></footer>
  `
})
export class AppComponent implements OnInit {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  get showNavigation(): boolean { return !this.router.url.startsWith('/access'); }

  get authenticated(): boolean { return this.session.isAuthenticated; }

  ngOnInit(): void {
    if (this.session.isAuthenticated) {
      this.session.loadProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined });
    }
  }

  logout(): void {
    this.session.clear();
    void this.router.navigate(['/access']);
  }
}
