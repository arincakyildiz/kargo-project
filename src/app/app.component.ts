import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Rol } from './core/models/base-model';
import { CurrentUserService } from './core/services/current-user.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { IconComponent, IconName } from './shared/components/icon/icon.component';

interface NavItem {
  yol: string;
  etiket: string;
  ikon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { yol: '/dashboard', etiket: 'Dashboard', ikon: 'dashboard' },
  { yol: '/gonderiler', etiket: 'Gönderiler', ikon: 'paket' },
  { yol: '/kurye-atama', etiket: 'Kurye Atama', ikon: 'kurye' },
  { yol: '/teslimatlar', etiket: 'Teslimatlar', ikon: 'teslimat' },
  { yol: '/iadeler', etiket: 'İadeler', ikon: 'iade' },
  { yol: '/bolgeler', etiket: 'Bölgeler', ikon: 'bolge' },
  { yol: '/raporlar', etiket: 'Raporlar', ikon: 'rapor' },
  { yol: '/audit-log', etiket: 'Audit Log', ikon: 'kayit' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ConfirmDialogComponent,
    ToastContainerComponent,
    IconComponent,
  ],
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

  /** Sidebar varsayılan olarak daraltık; imleç sol kenara yaklaşınca genişler. */
  readonly sidebarGenisletildi = signal(false);

  constructor(public currentUser: CurrentUserService) {}

  rolDegistir(rol: string): void {
    this.currentUser.rolDegistir(rol as Rol);
  }
}
