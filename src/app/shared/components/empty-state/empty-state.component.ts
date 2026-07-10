import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">{{ icon }}</div>
      <p class="empty-state__title">{{ title }}</p>
      <p class="empty-state__desc" *ngIf="description">{{ description }}</p>
    </div>
  `,
  styles: [`
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; color: var(--color-muted); }
    .empty-state__icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .empty-state__title { font-weight: 600; margin: 0; }
    .empty-state__desc { margin: 0.25rem 0 0; font-size: 0.875rem; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Kayıt bulunamadı';
  @Input() description?: string;
}
