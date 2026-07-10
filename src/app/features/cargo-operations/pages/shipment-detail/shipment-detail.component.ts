import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShipmentService, BusinessRuleError } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DeliveryProofService } from '../../services/delivery-proof.service';
import { StatusHistoryService } from '../../services/status-history.service';
import { Shipment, SHIPMENT_STATUS_TRANSITIONS, ShipmentStatus } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusLabelPipe, TarihPipe, StatusBadgeDirective, YetkiDirective],
  templateUrl: './shipment-detail.component.html',
  styleUrl: './shipment-detail.component.scss',
})
export class ShipmentDetailComponent implements OnInit {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly gonderi = signal<Shipment | null>(null);
  readonly islemDevamEdiyor = signal(false);

  readonly secilenKurye = signal('');
  readonly teslimAlan = signal('');
  readonly imzaVar = signal(true);
  readonly teslimatNot = signal('');

  private gonderiId = '';
  private gecmis = computed(() => this.statusHistory.gonderiGecmisi(this.gonderiId)());

  readonly gecmisListesi = computed(() => this.gecmis());

  readonly sonrakiDurumlar = computed<ShipmentStatus[]>(() => {
    const g = this.gonderi();
    if (!g) return [];
    return SHIPMENT_STATUS_TRANSITIONS[g.status].filter(
      (s) => s !== 'kurye-atandi' && s !== 'iade-talebi' && s !== 'iptal-edildi'
    );
  });

  readonly iadeAcilabilir = computed(() => {
    const g = this.gonderi();
    return !!g && SHIPMENT_STATUS_TRANSITIONS[g.status].includes('iade-talebi');
  });

  readonly iptalEdilebilir = computed(() => {
    const g = this.gonderi();
    return !!g && SHIPMENT_STATUS_TRANSITIONS[g.status].includes('iptal-edildi');
  });

  readonly kuryeAtanabilir = computed(() => this.gonderi()?.status === 'olusturuldu');
  readonly kanit = computed(() => (this.gonderiId ? this.deliveryProofService.gonderiKaniti(this.gonderiId) : undefined));
  readonly teslimatKanitiGerekli = computed(
    () => this.gonderi()?.status === 'dagitimda' && !this.kanit()
  );

  readonly uygunKuryeler = computed(() => {
    const g = this.gonderi();
    if (!g) return [];
    return this.courierService.aktifKuryeler().filter((k) => k.bolgeId === g.bolgeId);
  });

  constructor(
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private deliveryProofService: DeliveryProofService,
    private statusHistory: StatusHistoryService,
    private notification: NotificationService,
    private dialog: DialogService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.gonderiId = this.route.snapshot.paramMap.get('id') ?? '';
    await Promise.all([this.zoneService.tumunuGetir(), this.courierService.tumunuGetir()]);
    await this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    this.hataMesaji.set(null);
    try {
      const g = await this.shipmentService.birGetir(this.gonderiId);
      if (!g) {
        this.hataMesaji.set('Gönderi bulunamadı.');
      } else {
        this.gonderi.set(g);
      }
    } catch {
      this.hataMesaji.set('Gönderi yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }

  async kuryeAta(): Promise<void> {
    if (!this.secilenKurye()) {
      this.notification.error('Lütfen bir kurye seçin.');
      return;
    }
    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.kuryeAta(this.gonderiId, this.secilenKurye());
      this.gonderi.set(g);
      this.notification.success('Kurye ataması yapıldı.');
      this.secilenKurye.set('');
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : 'Kurye ataması başarısız oldu.');
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async durumDegistir(yeniStatus: ShipmentStatus): Promise<void> {
    if (yeniStatus === 'teslim-edildi' && !this.kanit()) {
      this.notification.error('Önce teslimat kanıtı ekleyin.');
      return;
    }

    const sonuc = await this.dialog.confirm({
      baslik: 'Durum Değişikliği',
      mesaj: `Gönderi durumu "${yeniStatus}" olarak güncellenecek. Onaylıyor musunuz?`,
      aciklamaGerekli: true,
      onayMetni: 'Durumu Güncelle',
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.durumDegistir(this.gonderiId, yeniStatus, sonuc.aciklama ?? '');
      this.gonderi.set(g);
      this.notification.success('Durum güncellendi.');
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : 'Durum güncellenemedi.');
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async teslimatKanitiKaydet(): Promise<void> {
    if (!this.teslimAlan().trim()) {
      this.notification.error('Teslim alan kişinin adı zorunludur.');
      return;
    }
    this.islemDevamEdiyor.set(true);
    try {
      await this.shipmentService.teslimatKanitiEkle(this.gonderiId, {
        teslimAlanAdSoyad: this.teslimAlan(),
        imzaVarMi: this.imzaVar(),
        not: this.teslimatNot() || undefined,
      });
      this.notification.success('Teslimat kanıtı kaydedildi. Şimdi durumu "Teslim Edildi" yapabilirsiniz.');
      this.teslimAlan.set('');
      this.teslimatNot.set('');
    } catch {
      this.notification.error('Teslimat kanıtı kaydedilemedi.');
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async iadeTalebiAc(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: 'İade Talebi',
      mesaj: 'Bu gönderi için iade talebi açılacak. Onaylıyor musunuz?',
      aciklamaGerekli: true,
      onayMetni: 'İade Talebi Aç',
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      await this.shipmentService.iadeTalebiOlustur(this.gonderiId, sonuc.aciklama ?? '');
      await this.yukle();
      this.notification.success('İade talebi oluşturuldu.');
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : 'İade talebi oluşturulamadı.');
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async iptalEt(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: 'Gönderiyi İptal Et',
      mesaj: 'İptal edilen gönderi tekrar aktifleştirilemez. Onaylıyor musunuz?',
      aciklamaGerekli: true,
      onayMetni: 'İptal Et',
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.iptalEt(this.gonderiId, sonuc.aciklama ?? '');
      this.gonderi.set(g);
      this.notification.success('Gönderi iptal edildi.');
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : 'Gönderi iptal edilemedi.');
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  duzenle(): void {
    this.router.navigate(['/gonderiler', this.gonderiId, 'duzenle']);
  }
}
