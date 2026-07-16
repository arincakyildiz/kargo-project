import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'paket'
  | 'kurye'
  | 'teslimat'
  | 'iade'
  | 'bolge'
  | 'rapor'
  | 'kayit'
  | 'saat'
  | 'arama'
  | 'kalem'
  | 'kapat'
  | 'bildirim'
  | 'ay'
  | 'gunes'
  | 'kullanici'
  | 'trend-yukari'
  | 'menu'
  | 'yazdir';

/** Uygulama genelinde kullanılan çizgi (stroke) ikon seti. */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [ngSwitch]="name"
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <ng-container *ngSwitchCase="'dashboard'">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </ng-container>
      <ng-container *ngSwitchCase="'paket'">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
        <path d="M3 8l9 5 9-5" />
        <path d="M12 13v8" />
      </ng-container>
      <ng-container *ngSwitchCase="'kurye'">
        <rect x="1" y="6" width="14" height="10" rx="1" />
        <path d="M15 9h4l3 3v4h-7" />
        <circle cx="6" cy="18.5" r="1.8" />
        <circle cx="18" cy="18.5" r="1.8" />
      </ng-container>
      <ng-container *ngSwitchCase="'teslimat'">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </ng-container>
      <ng-container *ngSwitchCase="'iade'">
        <path d="M3 5v6h6" />
        <path d="M3.5 11a9 9 0 1 0 2-6.5L3 7" />
      </ng-container>
      <ng-container *ngSwitchCase="'bolge'">
        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </ng-container>
      <ng-container *ngSwitchCase="'rapor'">
        <path d="M6 20v-4" />
        <path d="M12 20V10" />
        <path d="M18 20V4" />
      </ng-container>
      <ng-container *ngSwitchCase="'kayit'">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </ng-container>
      <ng-container *ngSwitchCase="'saat'">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </ng-container>
      <ng-container *ngSwitchCase="'arama'">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </ng-container>
      <ng-container *ngSwitchCase="'kalem'">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </ng-container>
      <ng-container *ngSwitchCase="'kapat'">
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
      </ng-container>
      <ng-container *ngSwitchCase="'bildirim'">
        <path d="M6 8a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 12.5 6 8z" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </ng-container>
      <ng-container *ngSwitchCase="'ay'">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </ng-container>
      <ng-container *ngSwitchCase="'gunes'">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </ng-container>
      <ng-container *ngSwitchCase="'kullanici'">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
      </ng-container>
      <ng-container *ngSwitchCase="'trend-yukari'">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </ng-container>
      <ng-container *ngSwitchCase="'menu'">
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
      </ng-container>
      <ng-container *ngSwitchCase="'yazdir'">
        <path d="M6 9V3h12v6" />
        <rect x="4" y="9" width="16" height="8" rx="1" />
        <path d="M6 17v4h12v-4" />
      </ng-container>
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 18;
}
