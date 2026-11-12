import { Component, Input } from '@angular/core';

@Component({
  selector: 'oc-notice',
  standalone: true,
  template: `
    @if (message) {
      <div class="notice" [class.notice-error]="kind === 'error'" [class.notice-success]="kind === 'success'"
        role="alert" aria-live="polite">
        <i class="pi" [class.pi-info-circle]="kind === 'info'" [class.pi-exclamation-circle]="kind === 'error'"
          [class.pi-check-circle]="kind === 'success'"></i>
        <span>{{ message }}</span>
      </div>
    }
  `
})
export class NoticeComponent {
  @Input() message = '';
  @Input() kind: 'info' | 'error' | 'success' = 'info';
}
