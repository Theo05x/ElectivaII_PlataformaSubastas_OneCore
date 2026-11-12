import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AccountFacade } from './account.facade';
import { toApiError } from '../../core/errors/api-error';
import { NoticeComponent } from '../../shared/components/notice.component';

@Component({
  selector: 'oc-access-page',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, NoticeComponent, RouterLink],
  template: `
    <main class="auth-layout">
      <section class="auth-story">
        <a class="brand brand-light" routerLink="/auctions"><span class="brand-mark"><i class="pi pi-bolt"></i></span> OneCore</a>
        <div class="story-copy">
          <p class="eyebrow">Subastas, con criterio</p>
          <h1>Encuentra algo<br><em>extraordinario.</em></h1>
          <p>Un espacio para descubrir, ofertar y vender artículos únicos dentro de nuestra comunidad.</p>
        </div>
        <div class="story-foot"><span>01 — Explora</span><span>02 — Participa</span><span>03 — Gana</span></div>
      </section>
      <section class="auth-main">
        <div class="auth-card">
          <p class="eyebrow">{{ registering ? 'Crea tu cuenta' : 'Qué gusto verte' }}</p>
          <h2>{{ registering ? 'Únete a OneCore' : 'Inicia sesión' }}</h2>
          <p class="muted">{{ registering ? 'Regístrate para publicar y participar en subastas.' : 'Ingresa tus datos para continuar.' }}</p>
          <oc-notice [message]="error" kind="error" />
          <form #accessForm="ngForm" (ngSubmit)="submit()" class="form-stack">
            @if (registering) {
              <label for="name">Nombre completo</label>
              <input id="name" pInputText [(ngModel)]="name" name="name" autocomplete="name" required minlength="2" placeholder="Tu nombre">
            }
            <label for="email">Correo electrónico</label>
            <input id="email" pInputText [(ngModel)]="email" name="email" type="email" autocomplete="email" required email placeholder="nombre@correo.com">
            <label for="password">Contraseña</label>
            <p-password inputId="password" [(ngModel)]="password" name="password" [feedback]="registering"
              [toggleMask]="true" [fluid]="true" [required]="true" [minlength]="registering ? 8 : 1"
              [autocomplete]="registering ? 'new-password' : 'current-password'" />
            <p-button type="submit" [label]="busy ? 'Un momento…' : (registering ? 'Crear cuenta' : 'Entrar')"
              icon="pi pi-arrow-right" iconPos="right" [disabled]="accessForm.invalid || busy" styleClass="w-full submit-button" />
          </form>
          <p class="auth-toggle">{{ registering ? '¿Ya tienes una cuenta?' : '¿Primera vez por aquí?' }}
            <button type="button" class="text-button" (click)="toggleMode()">{{ registering ? 'Inicia sesión' : 'Crea tu cuenta' }}</button>
          </p>
          <p class="security-note"><i class="pi pi-lock"></i> Sesión académica protegida con token de acceso.</p>
        </div>
      </section>
    </main>
  `
})
export class AccessPageComponent {
  private readonly account = inject(AccountFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  registering = false;
  busy = false;
  name = '';
  email = '';
  password = '';
  error = '';

  toggleMode(): void { this.registering = !this.registering; this.error = ''; }

  submit(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    const login = (): void => {
      this.account.login(this.email.trim(), this.password).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.busy = false;
          this.changeDetector.detectChanges();
          void this.router.navigate(['/auctions']);
        },
        error: error => {
          this.busy = false;
          this.error = toApiError(error).message;
          this.changeDetector.detectChanges();
        }
      });
    };

    if (!this.registering) { login(); return; }
    this.account.register(this.name.trim(), this.email.trim(), this.password).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.registering = false;
        this.error = '';
        this.changeDetector.detectChanges();
        login();
      },
      error: error => {
        this.busy = false;
        this.error = toApiError(error).message;
        this.changeDetector.detectChanges();
      }
    });
  }
}
