import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { AuctionFacade } from './auction.facade';
import { Auction } from '../../core/api/api.models';
import { toApiError } from '../../core/errors/api-error';
import { AuctionCardComponent } from '../../shared/components/auction-card.component';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-catalog-page',
  standalone: true,
  imports: [FormsModule, ButtonModule, RouterLink, AuctionCardComponent, NoticeComponent],
  template: `
    <main class="page-shell">
      <section class="catalog-hero">
        <div><p class="eyebrow">La selección de la comunidad</p><h1>Buenas cosas<br><em>encuentran dueño.</em></h1>
          <p class="hero-description">Explora artículos únicos y participa en subastas activas.</p></div>
        <div class="hero-note"><span class="hero-index">CO — 01</span><span>Descubre. Ofrece.<br>Hazlo tuyo.</span><i class="pi pi-arrow-down-right"></i></div>
      </section>
      <section class="catalog-controls" aria-label="Filtros de subastas">
        <div class="filter-label"><span class="eyebrow">Explorar</span><strong>Subastas</strong></div>
        <label class="sr-only" for="category">Filtrar por categoría</label>
        <select id="category" [(ngModel)]="category" (ngModelChange)="load(1)">
          <option value="">Todas las categorías</option>
          @for (item of categories; track item) { <option [value]="item">{{ item }}</option> }
        </select>
        <label class="sr-only" for="status">Filtrar por estado</label>
        <select id="status" [(ngModel)]="status" (ngModelChange)="load(1)">
          <option value="">Todos los estados</option><option value="OPEN">Abiertas</option>
          <option value="CLOSED">Cerradas</option><option value="DESIERTA">Sin ofertas</option>
          <option value="PAID">Pagadas</option><option value="CANCELLED">Canceladas</option>
        </select>
        <p-button label="Publicar artículo" icon="pi pi-plus" routerLink="/auctions/new" styleClass="publish-button" />
      </section>
      <oc-notice [message]="error" kind="error" />
      @if (loading) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i><span>Cargando subastas…</span></div>
      } @else if (auctions.length) {
        <section class="auction-grid" aria-label="Listado de subastas">
          @for (auction of auctions; track auction.id) {
            <oc-auction-card [auction]="auction" (selected)="open($event)" />
          }
        </section>
        <div class="pagination">
          <span class="muted">Página {{ page }} · {{ results }} resultados</span>
          <div><p-button label="Anterior" icon="pi pi-arrow-left" [outlined]="true" [disabled]="page <= 1" (onClick)="load(page - 1)" />
            <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" [outlined]="true"
              [disabled]="auctions.length < limit" (onClick)="load(page + 1)" /></div>
        </div>
      } @else if (!error) {
        <section class="empty-state"><span class="empty-icon"><i class="pi pi-search"></i></span>
          <h2>No hay subastas para mostrar</h2><p>Prueba con otros filtros o vuelve más tarde.</p>
          <p-button label="Limpiar filtros" [text]="true" (onClick)="clearFilters()" /></section>
      }
    </main>
  `
})
export class CatalogPageComponent implements OnInit {
  private readonly auctionsApi = inject(AuctionFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  auctions: Auction[] = [];
  categories: string[] = [];
  category = '';
  status = '';
  page = 1;
  readonly limit = 12;
  results = 0;
  loading = true;
  error = '';

  ngOnInit(): void {
    this.auctionsApi.categories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.categories = result; this.changeDetector.detectChanges(); },
      error: error => { this.error = toApiError(error).message; this.changeDetector.detectChanges(); }
    });
    this.load(1);
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.page = page;
    this.auctionsApi.list({ page, limit: this.limit, status: this.status || undefined, category: this.category || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.auctions = result.auctions;
          this.results = result.results;
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
  clearFilters(): void { this.category = ''; this.status = ''; this.load(1); }
}
