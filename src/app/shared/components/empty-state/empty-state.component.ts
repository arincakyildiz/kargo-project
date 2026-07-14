import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <p class="empty-state__title">{{ title }}</p>
      <p class="empty-state__desc" *ngIf="description">{{ description }}</p>
      <div class="empty-state__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; color: var(--color-muted); }
    .empty-state__title { font-weight: 600; margin: 0; }
    .empty-state__desc { margin: 0.25rem 0 0; font-size: 0.875rem; }
    .empty-state__actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .empty-state__actions:empty { display: none; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'Kayıt bulunamadı';
  @Input() description?: string;
}
