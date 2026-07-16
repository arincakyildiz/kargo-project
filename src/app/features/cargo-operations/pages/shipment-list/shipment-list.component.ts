import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { Shipment, SHIPMENT_STATUS_LABELS, ShipmentStatus } from '../../models/shipment.model';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

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
    TranslatePipe,
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

  /** Müşteri hizmetleri yalnızca arama yaparak "kendi kaydını" bulur; tüm listeyi göremez. */
  readonly aramaGerekli = computed(
    () => this.currentUser.rol() === 'musteri-hizmetleri' && !this.arama().trim()
  );

  readonly filtrelenmis = computed(() => {
    const aramaMetni = this.arama().trim().toLowerCase();
    const status = this.statusFiltre();
    if (this.aramaGerekli()) return [];
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

  /** Aktif sayfayı her zaman geçerli aralıkta tutar; veri küçülünce boş sayfada kalmayı önler. */
  readonly gecerliSayfa = computed(() => Math.min(this.sayfa(), this.toplamSayfa()));

  readonly sayfalanmis = computed(() => {
    const baslangic = (this.gecerliSayfa() - 1) * this.sayfaBoyu();
    return this.filtrelenmis().slice(baslangic, baslangic + this.sayfaBoyu());
  });

  constructor(
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private notification: NotificationService,
    private currentUser: CurrentUserService,
    private langService: LanguageService
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
      this.hataMesaji.set(this.langService.translate('error_loading_shipments'));
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

  csvDisariAktar(): void {
    const data = this.filtrelenmis();
    if (!data.length) {
      this.notification.error(this.langService.translate('no_export_data'));
      return;
    }

    const headers = ['Takip Kodu', 'Alici Ad Soyad', 'Alici Telefon', 'Bolge', 'Agirlik (kg)', 'Durum', 'Olusturulma Tarihi'];
    const rows = data.map((s) => [
      s.takipKodu,
      s.aliciAdSoyad,
      s.aliciTelefon,
      this.zoneService.liste().find((z) => z.id === s.bolgeId)?.ad ?? s.bolgeId,
      s.agirlikKg,
      s.status,
      s.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gonderiler_listesi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notification.success(this.langService.translate('csv_export_success'));
  }

  async csvTopluYukle(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        if (lines.length <= 1) {
          this.notification.error(this.langService.translate('csv_invalid_file'));
          return;
        }

        const parsedRows: Array<string[]> = [];
        for (let i = 1; i < lines.length; i++) {
          const row: string[] = [];
          let insideQuote = false;
          let currentField = '';
          const line = lines[i];

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              row.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          row.push(currentField.trim());
          parsedRows.push(row);
        }

        let basariliAdet = 0;
        let hataAdet = 0;
        const zones = this.zoneService.liste();

        for (const row of parsedRows) {
          if (row.length < 4) {
            hataAdet++;
            continue;
          }

          const [aliciAdSoyad, telefon, bolgeAd, agirlikStr, aciklama = ''] = row.map(v => v.replace(/^"|"$/g, ''));

          if (!aliciAdSoyad || aliciAdSoyad.length < 3 || aliciAdSoyad.length > 50) {
            hataAdet++;
            continue;
          }

          const cleanPhone = telefon.replace(/\s+/g, '');
          if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
            hataAdet++;
            continue;
          }

          const matchedZone = zones.find(
            (z) => z.ad.toLowerCase() === bolgeAd.toLowerCase() && z.aktifMi
          );
          if (!matchedZone) {
            hataAdet++;
            continue;
          }

          const agirlik = parseFloat(agirlikStr);
          if (isNaN(agirlik) || agirlik <= 0 || agirlik > 500) {
            hataAdet++;
            continue;
          }

          const yeniAdres = await this.zoneService.adresOlustur({
            aliciAdSoyad,
            telefon,
            acikAdres: this.langService.translate('bulk_csv_zone_delivery', { zone: matchedZone.ad }),
            bolgeId: matchedZone.id,
          });

          await this.shipmentService.olustur({
            aliciAdSoyad,
            aliciTelefon: telefon,
            adresId: yeniAdres.id,
            bolgeId: matchedZone.id,
            agirlikKg: agirlik,
            aciklama: aciklama.substring(0, 100),
          });

          basariliAdet++;
        }

        await this.yukle();

        if (basariliAdet > 0) {
          this.notification.success(this.langService.translate('csv_bulk_import_success', { count: basariliAdet }));
        }
        if (hataAdet > 0) {
          this.notification.info(this.langService.translate('csv_bulk_import_errors', { count: hataAdet }));
        }

      } catch (err) {
        this.notification.error(this.langService.translate('csv_parsing_error'));
      } finally {
        input.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  }
}
