import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReturnRequestService } from '../../services/return-request.service';
import { ShipmentService } from '../../services/shipment.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { ReturnRequest, ReturnRequestStatus } from '../../models/assignment.model';
import { Shipment } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';

const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  beklemede: 'Beklemede',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  tamamlandi: 'Tamamlandı',
};
const SAYFA_BOYU_SECENEKLERI = [10, 20, 50, 100];

type SiralamaAnahtari = 'createdAt-desc' | 'createdAt-asc';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, RouterLink, TarihPipe, EmptyStateComponent, YetkiDirective, DebounceDirective],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss',
})
export class ReturnsComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly returns = signal<ReturnRequest[]>([]);
  readonly gonderiler = signal<Map<string, Shipment>>(new Map());
  readonly islemDevamEdiyor = signal<string | null>(null);
  readonly statusFiltre = signal<ReturnRequestStatus | 'tumu'>('tumu');
  readonly arama = signal('');
  readonly siralama = signal<SiralamaAnahtari>('createdAt-desc');
  readonly sayfa = signal(1);
  readonly sayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[1]); // Varsayılan 20
  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;

  readonly statusLabels = RETURN_STATUS_LABELS;
  readonly statusSecenekleri = Object.entries(RETURN_STATUS_LABELS) as [ReturnRequestStatus, string][];

  private readonly siralamaFonksiyonlari: Record<SiralamaAnahtari, (a: ReturnRequest, b: ReturnRequest) => number> = {
    'createdAt-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
    'createdAt-asc': (a, b) => a.createdAt.localeCompare(b.createdAt),
  };

  readonly siraliListe = computed(() => {
    const status = this.statusFiltre();
    const aramaMetni = this.arama().trim().toLowerCase();
    return [...this.returns()]
      .filter((r) => (status === 'tumu' ? true : r.status === status))
      .filter((r) => {
        if (!aramaMetni) return true;
        const tk = this.takipKodu(r.shipmentId).toLowerCase();
        const neden = r.neden.toLowerCase();
        return tk.includes(aramaMetni) || neden.includes(aramaMetni);
      })
      .sort(this.siralamaFonksiyonlari[this.siralama()]);
  });

  readonly toplamSayfa = computed(() => Math.max(1, Math.ceil(this.siraliListe().length / this.sayfaBoyu())));

  /** Aktif sayfayı her zaman geçerli aralıkta tutar; veri küçülünce boş sayfada kalmayı önler. */
  readonly gecerliSayfa = computed(() => Math.min(this.sayfa(), this.toplamSayfa()));

  readonly sayfalanmis = computed(() => {
    const baslangic = (this.gecerliSayfa() - 1) * this.sayfaBoyu();
    return this.siraliListe().slice(baslangic, baslangic + this.sayfaBoyu());
  });

  statusFiltresiDegisti(status: string): void {
    this.statusFiltre.set(status as ReturnRequestStatus | 'tumu');
    this.sayfa.set(1);
  }

  aramaDegisti(deger: string): void {
    this.arama.set(deger);
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
    this.hataMesaji.set(null);
    try {
      const gonderiler = await this.shipmentService.tumunuGetir(DEMO_ERROR_RATE);
      this.gonderiler.set(new Map(gonderiler.map((g) => [g.id, g])));
      this.returns.set(this.returnRequestService.liste());
    } catch {
      this.hataMesaji.set('İade talepleri yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
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
