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
import { ShipmentService } from './features/cargo-operations/services/shipment.service';
import { NotificationService } from './core/services/notification.service';
import { DialogService } from './shared/components/confirm-dialog/dialog.service';

interface NavItem {
  yol: string;
  etiket: string;
  ikon: IconName;
  /** Belirtilmezse tüm roller görür; route guard'daki roller ile birebir eşleşir. */
  roller?: Rol[];
}

const OPERASYON_ROLLERI: Rol[] = ['operasyon-uzmani', 'kurye-sorumlusu'];

const NAV_ITEMS: NavItem[] = [
  { yol: '/dashboard', etiket: 'Dashboard', ikon: 'dashboard' },
  { yol: '/gonderiler', etiket: 'Gönderiler', ikon: 'paket' },
  { yol: '/kurye-atama', etiket: 'Kurye Atama', ikon: 'kurye', roller: OPERASYON_ROLLERI },
  { yol: '/teslimatlar', etiket: 'Teslimatlar', ikon: 'teslimat' },
  { yol: '/iadeler', etiket: 'İadeler', ikon: 'iade' },
  { yol: '/bolgeler', etiket: 'Bölgeler', ikon: 'bolge', roller: OPERASYON_ROLLERI },
  { yol: '/raporlar', etiket: 'Raporlar', ikon: 'rapor', roller: OPERASYON_ROLLERI },
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
  readonly roller: Rol[] = ['operasyon-uzmani', 'kurye-sorumlusu', 'musteri-hizmetleri'];
  readonly rolEtiketleri: Record<Rol, string> = {
    'operasyon-uzmani': 'Operasyon Uzmanı',
    'kurye-sorumlusu': 'Kurye Sorumlusu',
    'musteri-hizmetleri': 'Müşteri Hizmetleri',
  };

  /** Sidebar varsayılan olarak daraltık; imleç sol kenara yaklaşınca genişler. */
  readonly sidebarGenisletildi = signal(false);

  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.roller || this.currentUser.yetkiVarMi(item.roller))
  );

  readonly bildirimAcik = signal(false);
  readonly profilAcik = signal(false);
  readonly mobilMenuAcik = signal(false);
  readonly sonBildirimler = computed(() => this.audit.log().slice(0, BILDIRIM_SAYISI));
  readonly okunmamisBildirimSayisi = computed(() => this.audit.okunmamisBildirimler().length);

  readonly veriVarMi = this.shipmentService.veriVarMi;

  bildirimOkunmamis(id: string): boolean {
    return this.audit.okunmamisBildirimler().some((b) => b.id === id);
  }

  constructor(
    public currentUser: CurrentUserService,
    public theme: ThemeService,
    private audit: AuditService,
    public shipmentService: ShipmentService,
    private notification: NotificationService,
    private dialog: DialogService
  ) {}

  async ornekVeriYukle(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: 'Örnek Veri Yükle',
      mesaj: 'Sistem; örnek gönderi, kurye, bölge ve iade kayıtlarıyla doldurulacak. Devam edilsin mi?',
      onayMetni: 'Yükle',
    });
    if (!sonuc.onaylandi) return;

    this.shipmentService.ornekVeriYukle();
    this.notification.success('Örnek veri yüklendi.');
  }

  rolDegistir(rol: string): void {
    this.currentUser.rolDegistir(rol as Rol);
  }

  bildirimAc(event: MouseEvent): void {
    event.stopPropagation();
    this.profilAcik.set(false);
    const acilacak = !this.bildirimAcik();
    this.bildirimAcik.set(acilacak);
    if (acilacak) {
      this.audit.bildirimleriOkunduIsaretle(this.sonBildirimler().map((b) => b.id));
    }
  }

  tumunuOkunduIsaretle(): void {
    this.audit.bildirimleriOkunduIsaretle(this.audit.okunmamisBildirimler().map((b) => b.id));
  }

  profilAc(event: MouseEvent): void {
    event.stopPropagation();
    this.bildirimAcik.set(false);
    this.profilAcik.update((acik) => !acik);
  }

  mobilMenuDegistir(event: MouseEvent): void {
    event.stopPropagation();
    this.mobilMenuAcik.update((acik) => !acik);
  }

  @HostListener('document:click')
  disariTiklandi(): void {
    this.bildirimAcik.set(false);
    this.profilAcik.set(false);
    this.mobilMenuAcik.set(false);
  }
}
