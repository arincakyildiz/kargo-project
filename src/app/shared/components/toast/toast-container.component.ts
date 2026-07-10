import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts">
      <div
        *ngFor="let n of notification.notifications()"
        class="toast"
        [class.toast--success]="n.type === 'success'"
        [class.toast--error]="n.type === 'error'"
        [class.toast--info]="n.type === 'info'"
        (click)="notification.dismiss(n.id)"
      >
        {{ n.message }}
      </div>
    </div>
  `,
  styles: [`
    .toasts { position: fixed; top: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 2000; }
    .toast { padding: 0.75rem 1rem; border-radius: 8px; color: #fff; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.15); font-size: 0.9rem; max-width: 320px; }
    .toast--success { background: var(--color-success); }
    .toast--error { background: var(--color-danger); }
    .toast--info { background: var(--color-primary); }
  `],
})
export class ToastContainerComponent {
  constructor(public notification: NotificationService) {}
}
