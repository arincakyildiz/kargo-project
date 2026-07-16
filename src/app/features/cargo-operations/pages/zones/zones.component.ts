import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZoneService } from '../../services/zone.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { DeliveryZone } from '../../models/zone.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { TURKIYE_ILLERI } from '../../data/turkiye-iller';
import { ShipmentService } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';

const SAYFA_BOYU_SECENEKLERI = [10, 20, 50, 100];

type SiralamaAnahtari = 'ad-asc' | 'il-asc' | 'createdAt-desc';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, DebounceDirective, YetkiDirective],
  templateUrl: './zones.component.html',
  styleUrl: './zones.component.scss',
})
export class ZonesComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly zones = signal<DeliveryZone[]>([]);
  readonly formAcik = signal(false);
  readonly duzenlenenId = signal<string | null>(null);
  readonly kaydediliyor = signal(false);
  readonly arama = signal('');
  readonly statusFiltre = signal<string>('tumu'); // 'tumu', 'aktif', 'pasif'
  readonly siralama = signal<SiralamaAnahtari>('ad-asc');
  readonly sayfa = signal(1);
  readonly sayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[1]); // Varsayılan 20
  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;

  readonly turkiyeIlleri = TURKIYE_ILLERI;
  readonly seciliIl = signal<string>('');
  readonly secilenIlinIlceleri = computed(() =>
    this.turkiyeIlleri.find(i => i.il === this.seciliIl())?.ilceler ?? []
  );

  private readonly siralamaFonksiyonlari: Record<SiralamaAnahtari, (a: DeliveryZone, b: DeliveryZone) => number> = {
    'ad-asc': (a, b) => a.ad.localeCompare(b.ad),
    'il-asc': (a, b) => a.il.localeCompare(b.il),
    'createdAt-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
  };

  readonly filtrelenmis = computed(() => {
    const aramaMetni = this.arama().trim().toLowerCase();
    const status = this.statusFiltre();
    return this.zones()
      .filter((z) => {
        if (status === 'aktif') return z.aktifMi;
        if (status === 'pasif') return !z.aktifMi;
        return true;
      })
      .filter(
        (z) =>
          !aramaMetni ||
          z.ad.toLowerCase().includes(aramaMetni) ||
          z.il.toLowerCase().includes(aramaMetni) ||
          z.ilce.toLowerCase().includes(aramaMetni)
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

  readonly form = this.fb.nonNullable.group({
    ad: ['', [Validators.required, Validators.maxLength(50)]],
    il: ['', Validators.required],
    ilce: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private zoneService: ZoneService,
    private shipmentService: ShipmentService,
    private courierService: CourierService,
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
      this.zones.set(await this.zoneService.tumunuGetir(DEMO_ERROR_RATE));
    } catch {
      this.hataMesaji.set('Bölgeler yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }

  aramaDegisti(deger: string): void {
    this.arama.set(deger);
    this.sayfa.set(1);
  }

  statusFiltresiDegisti(status: string): void {
    this.statusFiltre.set(status);
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

  yeniFormAc(): void {
    this.duzenlenenId.set(null);
    this.seciliIl.set('');
    this.form.reset({ ad: '', il: '', ilce: '' });
    this.formAcik.set(true);
  }

  duzenleFormuAc(zone: DeliveryZone): void {
    this.duzenlenenId.set(zone.id);
    this.seciliIl.set(zone.il);
    this.form.reset({ ad: zone.ad, il: zone.il, ilce: zone.ilce });
    this.formAcik.set(true);
  }

  ilDegisti(il: string): void {
    this.seciliIl.set(il);
    this.form.controls.il.setValue(il);
    this.form.controls.ilce.setValue('');
  }

  ilceDegisti(ilce: string): void {
    this.form.controls.ilce.setValue(ilce);
  }

  formuKapat(): void {
    this.formAcik.set(false);
  }

  async kaydet(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.kaydediliyor.set(true);
    try {
      const veri = this.form.getRawValue();
      if (this.duzenlenenId()) {
        await this.zoneService.guncelle(this.duzenlenenId()!, veri);
        this.notification.success('Bölge güncellendi.');
      } else {
        await this.zoneService.olustur({ ...veri, aktifMi: true });
        this.notification.success('Bölge oluşturuldu.');
      }
      this.audit.kaydet({
        islemTipi: 'bolge-kaydet',
        rol: this.currentUser.rol(),
        aciklama: `Bölge kaydedildi: ${veri.ad}`,
      });
      this.formAcik.set(false);
      await this.yukle();
    } catch {
      this.notification.error('Bölge kaydedilirken bir hata oluştu.');
    } finally {
      this.kaydediliyor.set(false);
    }
  }

  async aktiflikDegistir(zone: DeliveryZone): Promise<void> {
    let mesaj = `"${zone.ad}" bölgesi ${zone.aktifMi ? 'pasife alınacak' : 'aktifleştirilecek'}. Onaylıyor musunuz?`;

    // Pasife almadan önce aktif gönderi kontrolü
    if (zone.aktifMi) {
      const aktifGonderiler = this.shipmentService.liste().filter(
        (s) => s.bolgeId === zone.id && !['teslim-edildi', 'iptal'].includes(s.status)
      );
      if (aktifGonderiler.length > 0) {
        mesaj = `"${zone.ad}" bölgesinde ${aktifGonderiler.length} aktif gönderi bulunuyor! Pasife alırsa bu gönderiler etkilenebilir. Devam etmek istediğinize emin misiniz?`;
      }
    }

    const sonuc = await this.dialog.confirm({
      baslik: zone.aktifMi ? 'Bölgeyi Pasife Al' : 'Bölgeyi Aktifleştir',
      mesaj,
      aciklamaGerekli: true,
      onayMetni: 'Onayla',
    });
    if (!sonuc.onaylandi) return;

    try {
      await this.zoneService.guncelle(zone.id, { aktifMi: !zone.aktifMi });
      this.audit.kaydet({
        islemTipi: 'bolge-durum',
        rol: this.currentUser.rol(),
        aciklama: `${zone.ad} bölgesi ${!zone.aktifMi ? 'aktif' : 'pasif'} yapıldı. ${sonuc.aciklama}`,
        hedefId: zone.id,
      });
      this.notification.success('Bölge durumu güncellendi.');
      await this.yukle();
    } catch {
      this.notification.error('Bölge durumu güncellenemedi.');
    }
  }

  async sil(zone: DeliveryZone): Promise<void> {
    // 1. Check active shipments
    const aktifGonderiler = this.shipmentService.liste().filter(
      (s) => s.bolgeId === zone.id && !['teslim-edildi', 'iptal-edildi'].includes(s.status)
    );
    if (aktifGonderiler.length > 0) {
      this.notification.error(`Bu bölgede ${aktifGonderiler.length} adet aktif gönderi bulunduğundan bölge silinemez!`);
      return;
    }

    // 2. Check assigned couriers
    const kuryeler = this.courierService.liste().filter((k) => k.bolgeId === zone.id);
    if (kuryeler.length > 0) {
      this.notification.error(`Bu bölgeye atanmış ${kuryeler.length} adet kurye bulunduğundan bölge silinemez!`);
      return;
    }

    const sonuc = await this.dialog.confirm({
      baslik: 'Bölgeyi Sil',
      mesaj: `"${zone.ad}" bölgesi kalıcı olarak silinecek. Onaylıyor musunuz?`,
      onayMetni: 'Sil',
    });
    if (!sonuc.onaylandi) return;

    try {
      await this.zoneService.sil(zone.id);
      this.audit.kaydet({
        islemTipi: 'bolge-sil',
        rol: this.currentUser.rol(),
        aciklama: `Bölge silindi: ${zone.ad}`,
      });
      this.notification.success('Bölge başarıyla silindi.');
      await this.yukle();
    } catch {
      this.notification.error('Bölge silinirken bir hata oluştu.');
    }
  }
}
