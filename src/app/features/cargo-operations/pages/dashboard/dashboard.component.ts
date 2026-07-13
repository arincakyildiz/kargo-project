import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { SHIPMENT_STATUS_COLORS, SHIPMENT_STATUS_LABELS, ShipmentStatus } from '../../models/shipment.model';
import { OperationMetric } from '../../models/operation-metric.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

const TERMINAL: ShipmentStatus[] = ['teslim-edildi', 'iade-edildi', 'iptal-edildi'];
const GECIKME_GUN = 3;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, EmptyStateComponent, YetkiDirective, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly shipments = this.shipmentService.liste;

  readonly metric = computed<OperationMetric>(() => {
    const list = this.shipments();
    const toplam = list.length;
    const statusDagilimi = Object.keys(SHIPMENT_STATUS_LABELS).reduce((acc, status) => {
      acc[status as ShipmentStatus] = list.filter((s) => s.status === status).length;
      return acc;
    }, {} as Record<ShipmentStatus, number>);

    const teslimEdildi = statusDagilimi['teslim-edildi'] ?? 0;
    const iade = (statusDagilimi['iade-talebi'] ?? 0) + (statusDagilimi['iade-edildi'] ?? 0);
    const simdi = Date.now();
    const geciken = list.filter((s) => {
      if (TERMINAL.includes(s.status)) return false;
      const gecenGun = (simdi - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return gecenGun > GECIKME_GUN;
    }).length;

    return {
      toplamGonderi: toplam,
      statusDagilimi,
      teslimEdildiOrani: toplam ? Math.round((teslimEdildi / toplam) * 100) : 0,
      geciken,
      iadeOrani: toplam ? Math.round((iade / toplam) * 100) : 0,
    };
  });

  readonly statusListesi = computed(() =>
    (Object.keys(SHIPMENT_STATUS_LABELS) as ShipmentStatus[]).map((status) => ({
      status,
      sayi: this.metric().statusDagilimi[status] ?? 0,
      renk: SHIPMENT_STATUS_COLORS[status],
    }))
  );

  readonly maxStatusSayi = computed(() => Math.max(1, ...this.statusListesi().map((s) => s.sayi)));

  constructor(private shipmentService: ShipmentService) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    this.hataMesaji.set(null);
    try {
      await this.shipmentService.tumunuGetir();
    } catch {
      this.hataMesaji.set('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }
}
