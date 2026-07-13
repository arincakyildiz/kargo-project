import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DeliveryProofService } from '../../services/delivery-proof.service';
import { Shipment, ShipmentStatus } from '../../models/shipment.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

const TESLIMAT_DURUMLARI: ShipmentStatus[] = ['dagitimda', 'teslim-edildi', 'teslim-edilemedi'];
const SAYFA_BOYU_SECENEKLERI = [10, 20, 50, 100];

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, TarihPipe, StatusBadgeDirective, DebounceDirective, EmptyStateComponent],
  templateUrl: './deliveries.component.html',
  styleUrl: './deliveries.component.scss',
})
export class DeliveriesComponent {
  readonly yukleniyor = signal(true);
  readonly gonderiler = signal<Shipment[]>([]);
  readonly statusFiltre = signal<ShipmentStatus | 'tumu'>('tumu');
  readonly arama = signal('');
  readonly sayfa = signal(1);
  readonly sayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[1]); // Varsayılan 20
  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;

  readonly teslimatlar = computed(() => this.gonderiler().filter((g) => TESLIMAT_DURUMLARI.includes(g.status)));

  readonly filtrelenmis = computed(() => {
    const status = this.statusFiltre();
    const aramaMetni = this.arama().trim().toLowerCase();
    return this.teslimatlar()
      .filter((g) => (status === 'tumu' ? true : g.status === status))
      .filter((g) =>
        aramaMetni
          ? g.takipKodu.toLowerCase().includes(aramaMetni) || g.aliciAdSoyad.toLowerCase().includes(aramaMetni)
          : true
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  readonly toplamSayfa = computed(() => Math.max(1, Math.ceil(this.filtrelenmis().length / this.sayfaBoyu())));

  readonly sayfalanmis = computed(() => {
    const baslangic = (this.sayfa() - 1) * this.sayfaBoyu();
    return this.filtrelenmis().slice(baslangic, baslangic + this.sayfaBoyu());
  });

  constructor(
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private deliveryProofService: DeliveryProofService
  ) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    await Promise.all([this.zoneService.tumunuGetir(), this.courierService.tumunuGetir()]);
    this.gonderiler.set(await this.shipmentService.tumunuGetir());
    this.yukleniyor.set(false);
  }

  kanitVarMi(shipmentId: string): boolean {
    return !!this.deliveryProofService.gonderiKaniti(shipmentId);
  }

  statusFiltresiDegisti(status: string): void {
    this.statusFiltre.set(status as ShipmentStatus | 'tumu');
    this.sayfa.set(1);
  }

  aramaDegisti(deger: string): void {
    this.arama.set(deger);
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
