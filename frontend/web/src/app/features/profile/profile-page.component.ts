import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { UserProfile } from '../../core/api/api.models';
import { AccountFacade } from '../auth/account.facade';
import { toApiError } from '../../core/errors/api-error';
import { AuctionCardComponent } from '../../shared/components/auction-card.component';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-profile-page',
  standalone: true,
  imports: [RouterLink, ButtonModule, AuctionCardComponent, NoticeComponent],
  template: `
    <main class="page-shell">
      <header class="page-heading profile-heading">
        <div><p class="eyebrow">Tu espacio en OneCore</p><h1>Hola, {{ profile?.user?.name || 'participante' }}.</h1>
          <p class="muted">{{ profile?.user?.email }}</p></div>
        <span class="avatar">{{ initials }}</span>
      </header>
      <oc-notice [message]="error" kind="error" />
      @if (loading) { <div class="loading-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando tu actividad…</span></div> }
      @else if (profile) {
        <section class="profile-stats">
          <div class="stat-card"><span class="metric-label">Artículos publicados</span><strong>{{ profile.publishedAuctions.length }}</strong></div>
          <div class="stat-card"><span class="metric-label">Subastas en las que participaste</span><strong>{{ profile.participatedAuctions.length }}</strong></div>
          <div class="stat-card"><span class="metric-label">Cuenta</span><strong>{{ profile.user.email }}</strong></div>
        </section>
        <section class="content-section">
          <div class="section-heading"><div><p class="eyebrow">Como vendedor</p><h2>Tus publicaciones</h2></div><a routerLink="/auctions/new" class="inline-link">Publicar artículo <i class="pi pi-arrow-up-right"></i></a></div>
          @if (profile.publishedAuctions.length) {
            <div class="auction-grid">
              @for (auction of profile.publishedAuctions; track auction.id) { <oc-auction-card [auction]="auction" (selected)="open($event)" /> }
            </div>
          } @else { <div class="empty-inline panel">Todavía no has publicado artículos. <a routerLink="/auctions/new">Crear tu primera subasta</a></div> }
        </section>
        <section class="content-section">
          <div class="section-heading"><div><p class="eyebrow">Como postor</p><h2>Tu actividad de ofertas</h2></div></div>
          @if (profile.participatedAuctions.length) {
            <div class="auction-grid">
              @for (auction of profile.participatedAuctions; track auction.id) { <oc-auction-card [auction]="auction" (selected)="open($event)" /> }
            </div>
          } @else { <div class="empty-inline panel">Aún no has participado en una subasta. <a routerLink="/auctions">Explorar subastas</a></div> }
        </section>
      } @else if (error) {
        <section class="empty-state">
          <h2>No pudimos cargar tu actividad</h2>
          <p>Revisa que la API esté conectada e inténtalo nuevamente.</p>
          <p-button label="Reintentar" icon="pi pi-refresh" (onClick)="load()" />
        </section>
      }
    </main>
  `
})
export class ProfilePageComponent implements OnInit {
  private readonly account = inject(AccountFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  profile: UserProfile | null = null;
  loading = true;
  error = '';

  get initials(): string {
    return (this.profile?.user.name ?? 'OC').split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.account.myActivity().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.profile = result;
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

  open(id: string): void { void this.router.navigate(['/auctions', id]); }
}
