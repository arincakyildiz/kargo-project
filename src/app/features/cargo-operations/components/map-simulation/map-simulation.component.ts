import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { ShipmentService } from '../../services/shipment.service';
import { ZoneService } from '../../services/zone.service';
import { CourierService } from '../../services/courier.service';
import { DeliveryZone } from '../../models/zone.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface MapNode {
  id: string;
  ad: string;
  x: number;
  y: number;
  color: string;
  gonderiSayisi: number;
  kuryeSayisi: number;
  dagitimdaSayisi: number;
  aktifMi: boolean;
}

@Component({
  selector: 'app-map-simulation',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './map-simulation.component.html',
  styleUrl: './map-simulation.component.scss',
})
export class MapSimulationComponent {
  @Input() seciliBolge = 'tumu';
  @Output() seciliBolgeDegisti = new EventEmitter<string>();

  // Düğüm koordinatları
  private readonly dugumKoordinatlari: Record<string, { x: number; y: number; color: string }> = {
    'zon-1': { x: 480, y: 70, color: '#3b82f6' }, // Kadıköy (Mavi)
    'zon-2': { x: 220, y: 70, color: '#8b5cf6' }, // Beşiktaş (Mor)
    'zon-3': { x: 560, y: 210, color: '#f59e0b' }, // Çankaya (Turuncu)
    'zon-4': { x: 140, y: 210, color: '#10b981' }, // Konak (Yeşil)
    'zon-5': { x: 350, y: 230, color: '#64748b' }, // Nilüfer (Gri - Pasif)
  };

  readonly merkezHub = { x: 350, y: 140, ad: 'Ana Transfer Merkezi' };

  readonly bolgeDugumleri = computed<MapNode[]>(() => {
    const zones = this.zoneService.liste();
    const shipments = this.shipmentService.liste();
    const couriers = this.courierService.liste();

    return zones.map((z) => {
      const koordinat = this.dugumKoordinatlari[z.id] || { x: 350, y: 150, color: '#64748b' };
      const zoneShipments = shipments.filter((s) => s.bolgeId === z.id);
      const zoneCouriers = couriers.filter((c) => c.bolgeId === z.id && c.aktifMi);
      const dagitimda = zoneShipments.filter((s) => s.status === 'dagitimda').length;

      return {
        id: z.id,
        ad: z.ad,
        x: koordinat.x,
        y: koordinat.y,
        color: koordinat.color,
        gonderiSayisi: zoneShipments.length,
        kuryeSayisi: zoneCouriers.length,
        dagitimdaSayisi: dagitimda,
        aktifMi: z.aktifMi,
      };
    });
  });

  // Dağıtımda olan kuryelerin simülasyon çizgileri
  readonly aktifKuryeYollari = computed(() => {
    return this.bolgeDugumleri()
      .filter((n) => n.aktifMi && n.dagitimdaSayisi > 0)
      .map((n) => {
        // Alt adres noktaları üretelim (simüle etmek için)
        const subPoints = [
          { x: n.x + 30, y: n.y - 20 },
          { x: n.x - 30, y: n.y + 20 },
          { x: n.x + 20, y: n.y + 30 },
        ];
        return {
          id: n.id,
          bolgeAd: n.ad,
          color: n.color,
          startX: n.x,
          startY: n.y,
          points: subPoints.slice(0, Math.min(subPoints.length, n.dagitimdaSayisi)),
        };
      });
  });

  constructor(
    private shipmentService: ShipmentService,
    private zoneService: ZoneService,
    private courierService: CourierService
  ) {}

  dugumSec(nodeId: string): void {
    const yeni = this.seciliBolge === nodeId ? 'tumu' : nodeId;
    this.seciliBolgeDegisti.emit(yeni);
  }
}
