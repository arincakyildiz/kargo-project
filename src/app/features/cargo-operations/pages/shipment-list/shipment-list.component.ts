import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { Shipment, SHIPMENT_STATUS_LABELS, ShipmentStatus } from '../../models/shipment.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';

const SAYFA_BOYU_SECENEKLERI = [10, 30, 50, 80, 100];

type SiralamaAnahtari = 'createdAt-desc' | 'createdAt-asc' | 'takipKodu-asc' | 'agirlikKg-desc';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusLabelPipe,
    TarihPipe,
    StatusBadgeDirective,
    DebounceDirective,
    EmptyStateComponent,
    YetkiDirective,
  ],
  templateUrl: './shipment-list.component.html',
  styleUrl: './shipment-list.component.scss',
})
export class ShipmentListComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly gonderiler = signal<Shipment[]>([]);

  readonly arama = signal('');
  readonly statusFiltre = signal<ShipmentStatus | 'tumu'>('tumu');
  readonly siralama = signal<SiralamaAnahtari>('createdAt-desc');
  readonly sayfa = signal(1);
  readonly sayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[0]);

  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;
  readonly statusSecenekleri = Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][];

  private readonly siralamaFonksiyonlari: Record<SiralamaAnahtari, (a: Shipment, b: Shipment) => number> = {
    'createdAt-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
    'createdAt-asc': (a, b) => a.createdAt.localeCompare(b.createdAt),
    'takipKodu-asc': (a, b) => a.takipKodu.localeCompare(b.takipKodu),
    'agirlikKg-desc': (a, b) => b.agirlikKg - a.agirlikKg,
  };

  readonly filtrelenmis = computed(() => {
    const aramaMetni = this.arama().trim().toLowerCase();
    const status = this.statusFiltre();
    return this.gonderiler()
      .filter((g) => (status === 'tumu' ? true : g.status === status))
      .filter((g) =>
        aramaMetni
          ? g.takipKodu.toLowerCase().includes(aramaMetni) || g.aliciAdSoyad.toLowerCase().includes(aramaMetni)
          : true
      )
      .sort(this.siralamaFonksiyonlari[this.siralama()]);
  });

  readonly toplamSayfa = computed(() => Math.max(1, Math.ceil(this.filtrelenmis().length / this.sayfaBoyu())));

  readonly sayfalanmis = computed(() => {
    const baslangic = (this.sayfa() - 1) * this.sayfaBoyu();
    return this.filtrelenmis().slice(baslangic, baslangic + this.sayfaBoyu());
  });

  constructor(
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService
  ) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    this.hataMesaji.set(null);
    try {
      const liste = await this.shipmentService.tumunuGetir(DEMO_ERROR_RATE);
      this.gonderiler.set(liste);
    } catch {
      this.hataMesaji.set('Gönderiler yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }

  aramaDegisti(deger: string): void {
    this.arama.set(deger);
    this.sayfa.set(1);
  }

  statusFiltresiDegisti(status: string): void {
    this.statusFiltre.set(status as ShipmentStatus | 'tumu');
    this.sayfa.set(1);
  }

  siralamaDegisti(deger: string): void {
    this.siralama.set(deger as SiralamaAnahtari);
    this.sayfa.set(1);
  }

  sayfaBoyuDegisti(deger: string): void {
    this.sayfaBoyu.set(Number(deger));
    this.sayfa.set(1);
  }

  sayfayaGit(yeniSayfa: number): void {
    if (yeniSayfa < 1 || yeniSayfa > this.toplamSayfa()) return;
    this.sayfa.set(yeniSayfa);
  }
}
