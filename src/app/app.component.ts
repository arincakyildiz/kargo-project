import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Rol } from './core/models/base-model';
import { CurrentUserService } from './core/services/current-user.service';
import { AuditService } from './core/services/audit.service';
import { ThemeService } from './core/services/theme.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { IconComponent, IconName } from './shared/components/icon/icon.component';
import { TarihPipe } from './shared/pipes/tarih.pipe';

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

const BILDIRIM_SAYISI = 5;

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
    TarihPipe,
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

  readonly bildirimAcik = signal(false);
  readonly profilAcik = signal(false);
  readonly sonBildirimler = computed(() => this.audit.log().slice(0, BILDIRIM_SAYISI));

  constructor(
    public currentUser: CurrentUserService,
    public theme: ThemeService,
    private audit: AuditService
  ) {}

  rolDegistir(rol: string): void {
    this.currentUser.rolDegistir(rol as Rol);
  }

  bildirimAc(event: MouseEvent): void {
    event.stopPropagation();
    this.profilAcik.set(false);
    this.bildirimAcik.update((acik) => !acik);
  }

  profilAc(event: MouseEvent): void {
    event.stopPropagation();
    this.bildirimAcik.set(false);
    this.profilAcik.update((acik) => !acik);
  }

  @HostListener('document:click')
  disariTiklandi(): void {
    this.bildirimAcik.set(false);
    this.profilAcik.set(false);
  }
}
