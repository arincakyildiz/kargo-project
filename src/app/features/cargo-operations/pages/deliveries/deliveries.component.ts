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
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

const TESLIMAT_DURUMLARI: ShipmentStatus[] = ['dagitimda', 'teslim-edildi', 'teslim-edilemedi'];

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, TarihPipe, StatusBadgeDirective, EmptyStateComponent],
  templateUrl: './deliveries.component.html',
  styleUrl: './deliveries.component.scss',
})
export class DeliveriesComponent {
  readonly yukleniyor = signal(true);
  readonly gonderiler = signal<Shipment[]>([]);
  readonly statusFiltre = signal<ShipmentStatus | 'tumu'>('tumu');

  readonly teslimatlar = computed(() => this.gonderiler().filter((g) => TESLIMAT_DURUMLARI.includes(g.status)));

  readonly filtrelenmis = computed(() => {
    const status = this.statusFiltre();
    return this.teslimatlar()
      .filter((g) => (status === 'tumu' ? true : g.status === status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
  }
}
