import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Rol } from './core/models/base-model';
import { CurrentUserService } from './core/services/current-user.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';

interface NavItem {
  yol: string;
  etiket: string;
}

const NAV_ITEMS: NavItem[] = [
  { yol: '/dashboard', etiket: 'Dashboard' },
  { yol: '/gonderiler', etiket: 'Gönderiler' },
  { yol: '/kurye-atama', etiket: 'Kurye Atama' },
  { yol: '/teslimatlar', etiket: 'Teslimatlar' },
  { yol: '/iadeler', etiket: 'İadeler' },
  { yol: '/bolgeler', etiket: 'Bölgeler' },
  { yol: '/raporlar', etiket: 'Raporlar' },
  { yol: '/audit-log', etiket: 'Audit Log' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly navItems = NAV_ITEMS;
  readonly roller: Rol[] = ['operasyon-uzmani', 'kurye-sorumlusu', 'musteri-hizmetleri'];
  readonly rolEtiketleri: Record<Rol, string> = {
    'operasyon-uzmani': 'Operasyon Uzmanı',
    'kurye-sorumlusu': 'Kurye Sorumlusu',
    'musteri-hizmetleri': 'Müşteri Hizmetleri',
  };

  constructor(public currentUser: CurrentUserService) {}

  rolDegistir(rol: string): void {
    this.currentUser.rolDegistir(rol as Rol);
  }
}
