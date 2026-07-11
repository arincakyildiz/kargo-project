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
  | 'kayit';

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
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 18;
}
