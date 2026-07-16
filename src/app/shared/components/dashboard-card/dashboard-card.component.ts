import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Dashboard'daki özet kartları için ortak kabuk: başlık + ikon + opsiyonel
 * "tümünü gör" bağlantısı. İçerik ng-content ile enjekte edilir.
 */
@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, TranslatePipe],
  template: `
    <section class="dashboard-card">
      <header class="dashboard-card__header">
        <h2>
          <app-icon *ngIf="ikon" [name]="ikon" [size]="16"></app-icon>
          {{ baslik }}
        </h2>
        <a *ngIf="tumunuGorYolu" [routerLink]="tumunuGorYolu" class="dashboard-card__link">{{ 'view_all' | translate }}</a>
      </header>
      <div class="dashboard-card__body">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-card {
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        padding: 1.1rem 1.25rem 1.25rem;
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: box-shadow 0.18s ease, transform 0.18s ease;
      }
      .dashboard-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
      .dashboard-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.85rem;
      }
      .dashboard-card__header h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 0.95rem;
      }
      .dashboard-card__link {
        font-size: 0.76rem;
        font-weight: 600;
        text-decoration: none;
        color: var(--color-primary);
        white-space: nowrap;
      }
      .dashboard-card__link:hover { text-decoration: underline; }
      .dashboard-card__body { flex: 1; min-width: 0; }
    `,
  ],
})
export class DashboardCardComponent {
  @Input() baslik = '';
  @Input() ikon?: IconName;
  @Input() tumunuGorYolu?: string;
}
