import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReturnRequestService } from '../../services/return-request.service';
import { ShipmentService } from '../../services/shipment.service';
import { ReturnRequest, ReturnRequestStatus } from '../../models/assignment.model';
import { Shipment } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';

const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  beklemede: 'Beklemede',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  tamamlandi: 'Tamamlandı',
};

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, RouterLink, TarihPipe, EmptyStateComponent, YetkiDirective],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss',
})
export class ReturnsComponent {
  readonly yukleniyor = signal(true);
  readonly returns = signal<ReturnRequest[]>([]);
  readonly gonderiler = signal<Map<string, Shipment>>(new Map());
  readonly islemDevamEdiyor = signal<string | null>(null);
  readonly statusFiltre = signal<ReturnRequestStatus | 'tumu'>('tumu');

  readonly statusLabels = RETURN_STATUS_LABELS;
  readonly statusSecenekleri = Object.entries(RETURN_STATUS_LABELS) as [ReturnRequestStatus, string][];

  readonly siraliListe = computed(() => {
    const status = this.statusFiltre();
    return [...this.returns()]
      .filter((r) => (status === 'tumu' ? true : r.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  statusFiltresiDegisti(status: string): void {
    this.statusFiltre.set(status as ReturnRequestStatus | 'tumu');
  }

  constructor(
    private returnRequestService: ReturnRequestService,
    private shipmentService: ShipmentService,
    private notification: NotificationService,
    private audit: AuditService,
    private currentUser: CurrentUserService,
    private dialog: DialogService
  ) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    const gonderiler = await this.shipmentService.tumunuGetir();
    this.gonderiler.set(new Map(gonderiler.map((g) => [g.id, g])));
    this.returns.set(this.returnRequestService.liste());
    this.yukleniyor.set(false);
  }

  takipKodu(shipmentId: string): string {
    return this.gonderiler().get(shipmentId)?.takipKodu ?? '—';
  }

  async durumGuncelle(iade: ReturnRequest, yeniStatus: ReturnRequestStatus): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: 'İade Talebi Durumu',
      mesaj: `İade talebi "${this.statusLabels[yeniStatus]}" olarak işaretlenecek. Onaylıyor musunuz?`,
      aciklamaGerekli: true,
      onayMetni: 'Onayla',
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(iade.id);
    try {
      await this.returnRequestService.durumGuncelle(iade.id, yeniStatus);
      if (yeniStatus === 'tamamlandi') {
        await this.shipmentService.durumDegistir(iade.shipmentId, 'iade-edildi', sonuc.aciklama ?? '');
      }
      this.audit.kaydet({
        islemTipi: 'iade-durum',
        rol: this.currentUser.rol(),
        aciklama: `${this.takipKodu(iade.shipmentId)} iade talebi ${this.statusLabels[yeniStatus]} yapıldı. ${sonuc.aciklama}`,
        hedefId: iade.id,
        eskiDeger: iade.status,
        yeniDeger: yeniStatus,
      });
      this.notification.success('İade talebi güncellendi.');
      await this.yukle();
    } catch {
      this.notification.error('İade talebi güncellenemedi.');
    } finally {
      this.islemDevamEdiyor.set(null);
    }
  }
}
