import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuctionFacade } from './auction.facade';
import { toApiError } from '../../core/errors/api-error';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-publish-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, NoticeComponent],
  template: `
    <main class="page-shell narrow-shell">
      <a routerLink="/auctions" class="back-link"><i class="pi pi-arrow-left"></i> Volver a subastas</a>
      <header class="page-heading"><p class="eyebrow">Comparte con la comunidad</p><h1>Publica un artículo</h1>
        <p class="muted">Cuéntanos qué ofreces. La duración debe ser de 1 hora a 30 días.</p></header>
      <oc-notice [message]="error" kind="error" />
      <section class="panel form-panel">
        <form #form="ngForm" (ngSubmit)="submit()" class="form-stack">
          <div class="form-section-title"><span>01</span><div><h2>El artículo</h2><p>Información clara ayuda a generar confianza.</p></div></div>
          <label for="title">Nombre del artículo</label><input id="title" pInputText [(ngModel)]="title" name="title" required maxlength="120">
          <label for="description">Descripción</label><textarea id="description" pInputText [(ngModel)]="description" name="description" required rows="4" maxlength="1500"></textarea>
          <div class="two-fields"><div><label for="condition">Estado de conservación</label><input id="condition" pInputText [(ngModel)]="condition" name="condition" required placeholder="Ej. Muy bueno"></div>
            <div><label for="category">Categoría</label><input id="category" pInputText [(ngModel)]="category" name="category" required placeholder="Ej. Tecnología"></div></div>
          <div class="form-section-title section-spaced"><span>02</span><div><h2>La subasta</h2><p>Precios expresados en pesos colombianos.</p></div></div>
          <div class="two-fields"><div><label for="basePrice">Precio base (COP)</label><input id="basePrice" pInputText type="number" [(ngModel)]="basePrice" name="basePrice" min="1" step="1" required></div>
            <div><label for="increment">Incremento mínimo (COP)</label><input id="increment" pInputText type="number" [(ngModel)]="increment" name="increment" min="1" step="1" required></div></div>
          <label for="endDate">Fecha y hora de cierre</label><input id="endDate" pInputText type="datetime-local" [(ngModel)]="endDate" name="endDate" required>
          <p-button type="submit" [label]="busy ? 'Publicando…' : 'Publicar subasta'" icon="pi pi-arrow-right" iconPos="right"
            [disabled]="form.invalid || busy" styleClass="submit-button form-submit" />
        </form>
      </section>
    </main>
  `
})
export class PublishPageComponent implements OnInit {
  private readonly auctionsApi = inject(AuctionFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  title = ''; description = ''; condition = ''; category = '';
  basePrice: number | null = null; increment: number | null = null; endDate = '';
  busy = false; error = '';

  ngOnInit(): void {
    const suggested = new Date(Date.now() + 24 * 60 * 60 * 1000);
    suggested.setMinutes(suggested.getMinutes() - suggested.getTimezoneOffset());
    this.endDate = suggested.toISOString().slice(0, 16);
  }

  submit(): void {
    if (this.busy || this.basePrice === null || this.increment === null || !this.endDate) return;
    this.busy = true; this.error = '';
    this.auctionsApi.publish({
      article: { title: this.title.trim(), description: this.description.trim(), conservationState: this.condition.trim() },
      category: this.category.trim(), basePrice: this.basePrice, minimumIncrement: this.increment,
      endDate: new Date(this.endDate).toISOString()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => void this.router.navigate(['/auctions', result.id]),
      error: error => {
        this.error = toApiError(error).message;
        this.busy = false;
        this.changeDetector.detectChanges();
      }
    });
  }
}
