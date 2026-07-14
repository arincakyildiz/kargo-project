import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { AuditService } from '../../../../core/services/audit.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import {
  SHIPMENT_STATUS_COLORS,
  SHIPMENT_STATUS_LABELS,
  Shipment,
  ShipmentStatus,
} from '../../models/shipment.model';
import { OperationMetric } from '../../models/operation-metric.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { DoughnutChartComponent, DoughnutDilim } from '../../../../shared/components/chart/doughnut-chart.component';

const TERMINAL: ShipmentStatus[] = ['teslim-edildi', 'iade-edildi', 'iptal-edildi'];
const GECIKME_GUN = 3;
const OZET_LISTE_UZUNLUGU = 5;

function gunAyni(isoTarih: string, referans: Date): boolean {
  const t = new Date(isoTarih);
  return (
    t.getFullYear() === referans.getFullYear() &&
    t.getMonth() === referans.getMonth() &&
    t.getDate() === referans.getDate()
  );
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusLabelPipe,
    TarihPipe,
    StatusBadgeDirective,
    EmptyStateComponent,
    YetkiDirective,
    IconComponent,
    DashboardCardComponent,
    DoughnutChartComponent,
  ],
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

  /** Bugün oluşturulan / teslim edilen / iadeye açılan gönderi sayıları — KPI trend rozetleri için. */
  readonly gunlukTrend = computed(() => {
    const bugun = new Date();
    const list = this.shipments();
    const bugunOlusturulan = list.filter((s) => gunAyni(s.createdAt, bugun)).length;
    const bugunTeslimEdilen = list.filter(
      (s) => s.status === 'teslim-edildi' && gunAyni(s.updatedAt, bugun)
    ).length;
    const bugunIade = list.filter(
      (s) => ['iade-talebi', 'iade-edildi'].includes(s.status) && gunAyni(s.updatedAt, bugun)
    ).length;
    const enEskiGecikenGun = Math.max(
      0,
      ...list
        .filter((s) => !TERMINAL.includes(s.status))
        .map((s) => Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    );
    return { bugunOlusturulan, bugunTeslimEdilen, bugunIade, enEskiGecikenGun };
  });

  readonly statusListesi = computed(() =>
    (Object.keys(SHIPMENT_STATUS_LABELS) as ShipmentStatus[]).map((status) => ({
      status,
      sayi: this.metric().statusDagilimi[status] ?? 0,
      renk: SHIPMENT_STATUS_COLORS[status],
    }))
  );

  readonly maxStatusSayi = computed(() => Math.max(1, ...this.statusListesi().map((s) => s.sayi)));

  readonly durumGrafigi = computed<DoughnutDilim[]>(() =>
    this.statusListesi()
      .filter((s) => s.sayi > 0)
      .map((s) => ({ etiket: SHIPMENT_STATUS_LABELS[s.status], deger: s.sayi, renk: s.renk }))
  );

  readonly sonGonderiler = computed<Shipment[]>(() =>
    [...this.shipments()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, OZET_LISTE_UZUNLUGU)
  );

  readonly enAktifKuryeler = computed(() => {
    const sayaç = new Map<string, number>();
    for (const s of this.shipments()) {
      if (!s.kuryeId) continue;
      sayaç.set(s.kuryeId, (sayaç.get(s.kuryeId) ?? 0) + 1);
    }
    return this.courierService
      .liste()
      .map((k) => ({ kurye: k, sayi: sayaç.get(k.id) ?? 0 }))
      .filter((k) => k.sayi > 0)
      .sort((a, b) => b.sayi - a.sayi)
      .slice(0, OZET_LISTE_UZUNLUGU);
  });

  readonly enYogunBolgeler = computed(() => {
    const sayaç = new Map<string, number>();
    for (const s of this.shipments()) {
      sayaç.set(s.bolgeId, (sayaç.get(s.bolgeId) ?? 0) + 1);
    }
    return this.zoneService
      .liste()
      .map((z) => ({ bolge: z, sayi: sayaç.get(z.id) ?? 0 }))
      .filter((z) => z.sayi > 0)
      .sort((a, b) => b.sayi - a.sayi)
      .slice(0, OZET_LISTE_UZUNLUGU);
  });

  readonly sonAuditLog = computed(() => this.audit.log().slice(0, OZET_LISTE_UZUNLUGU));

  readonly maxKuryeSayi = computed(() => Math.max(1, ...this.enAktifKuryeler().map((k) => k.sayi)));
  readonly maxBolgeSayi = computed(() => Math.max(1, ...this.enYogunBolgeler().map((b) => b.sayi)));

  constructor(
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private audit: AuditService,
    private notification: NotificationService,
    private dialog: DialogService
  ) {
    this.yukle();
  }

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

  async verileriSil(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: 'Tüm Verileri Sil',
      mesaj: 'Bu işlem geri alınamaz. Tüm gönderiler, kuryeler, bölgeler, adresler ve audit log kalıcı olarak silinecek.',
      aciklamaGerekli: true,
      onayMetni: 'Sil',
    });
    if (!sonuc.onaylandi) return;

    this.shipmentService.verileriSil();
    this.notification.success('Tüm veriler silindi.');
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    this.hataMesaji.set(null);
    try {
      await Promise.all([
        this.shipmentService.tumunuGetir(DEMO_ERROR_RATE),
        this.courierService.tumunuGetir(DEMO_ERROR_RATE),
        this.zoneService.tumunuGetir(DEMO_ERROR_RATE),
      ]);
    } catch {
      this.hataMesaji.set('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }
}
