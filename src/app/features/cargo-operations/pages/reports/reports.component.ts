import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { Shipment, ShipmentStatus } from '../../models/shipment.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';

const TERMINAL: ShipmentStatus[] = ['teslim-edildi', 'iade-edildi', 'iptal-edildi'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, IconComponent, YetkiDirective],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly gonderiler = signal<Shipment[]>([]);

  readonly bolgeRaporu = computed(() =>
    this.zoneService.liste().map((zone) => {
      const bolgeGonderileri = this.gonderiler().filter((g) => g.bolgeId === zone.id);
      const teslimEdildi = bolgeGonderileri.filter((g) => g.status === 'teslim-edildi').length;
      const iade = bolgeGonderileri.filter((g) => ['iade-talebi', 'iade-edildi'].includes(g.status)).length;
      return {
        zone,
        toplam: bolgeGonderileri.length,
        teslimEdildi,
        iade,
        teslimOrani: bolgeGonderileri.length ? Math.round((teslimEdildi / bolgeGonderileri.length) * 100) : 0,
      };
    }).filter((r) => r.toplam > 0)
  );

  readonly kuryeRaporu = computed(() =>
    this.courierService.liste().map((kurye) => {
      const kuryeGonderileri = this.gonderiler().filter((g) => g.kuryeId === kurye.id);
      const teslimEdilenler = kuryeGonderileri.filter((g) => g.status === 'teslim-edildi');
      const teslimEdildi = teslimEdilenler.length;
      const basarisiz = kuryeGonderileri.filter((g) => g.status === 'teslim-edilemedi').length;

      const ortalamaTeslimSaat = teslimEdilenler.length
        ? teslimEdilenler.reduce((toplamSaat, g) => {
            const saat = (new Date(g.updatedAt).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60);
            return toplamSaat + Math.max(saat, 0);
          }, 0) / teslimEdilenler.length
        : null;

      return {
        kurye,
        toplam: kuryeGonderileri.length,
        teslimEdildi,
        basarisiz,
        basariOrani: kuryeGonderileri.length ? Math.round((teslimEdildi / kuryeGonderileri.length) * 100) : 0,
        ortalamaTeslimSaat,
      };
    }).filter((r) => r.toplam > 0)
  );

  /** Ortalama teslim süresini okunur biçime çevirir: 24 saatten kısaysa saat, uzunsa gün cinsinden. */
  sureFormatla(saat: number | null): string {
    if (saat === null) return '—';
    if (saat < 24) return `${Math.round(saat)} saat`;
    return `${(saat / 24).toFixed(1)} gün`;
  }

  readonly genelOzet = computed(() => {
    const list = this.gonderiler();
    const simdi = Date.now();
    const geciken = list.filter((g) => {
      if (TERMINAL.includes(g.status)) return false;
      const gun = (simdi - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return gun > 3;
    }).length;
    return {
      toplam: list.length,
      teslimEdildi: list.filter((g) => g.status === 'teslim-edildi').length,
      geciken,
      iade: list.filter((g) => ['iade-talebi', 'iade-edildi'].includes(g.status)).length,
      iptal: list.filter((g) => g.status === 'iptal-edildi').length,
    };
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
      await Promise.all([this.zoneService.tumunuGetir(), this.courierService.tumunuGetir()]);
      this.gonderiler.set(await this.shipmentService.tumunuGetir(DEMO_ERROR_RATE));
    } catch {
      this.hataMesaji.set('Rapor verileri yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }

  yazdir(): void {
    window.print();
  }
}
