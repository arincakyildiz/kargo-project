import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShipmentService, BusinessRuleError } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DeliveryProofService } from '../../services/delivery-proof.service';
import { StatusHistoryService } from '../../services/status-history.service';
import { Shipment, SHIPMENT_STATUS_TRANSITIONS, SHIPMENT_STATUS_COLORS, ShipmentStatus } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { StatusBadgeDirective } from '../../../../shared/directives/status-badge.directive';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusLabelPipe, TarihPipe, StatusBadgeDirective, YetkiDirective, TranslatePipe, IconComponent],
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
  readonly musteriNotu = signal('');

  private gonderiId = '';
  private gecmis = computed(() => this.statusHistory.gonderiGecmisi(this.gonderiId)());

  readonly gecmisListesi = computed(() => this.gecmis());

  statusRengi(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_COLORS[status];
  }

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

  readonly aktifAdimIndex = computed(() => {
    const g = this.gonderi();
    if (!g) return 0;
    switch (g.status) {
      case 'olusturuldu': return 1;
      case 'kurye-atandi': return 2;
      case 'dagitimda': return 3;
      case 'teslim-edilemedi': return 3;
      case 'iade-talebi': return 3;
      case 'teslim-edildi': return 4;
      case 'iade-edildi': return 4;
      default: return 0;
    }
  });

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
    private router: Router,
    private langService: LanguageService
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
      const g = await this.shipmentService.birGetir(this.gonderiId, DEMO_ERROR_RATE);
      if (!g) {
        this.hataMesaji.set(this.langService.translate('shipment_not_found'));
      } else {
        this.gonderi.set(g);
      }
    } catch {
      this.hataMesaji.set(this.langService.translate('error_loading_shipments'));
    } finally {
      this.yukleniyor.set(false);
    }
  }

  async kuryeAta(): Promise<void> {
    if (!this.secilenKurye()) {
      this.notification.error(this.langService.translate('select_courier_required'));
      return;
    }
    const kurye = this.uygunKuryeler().find((k) => k.id === this.secilenKurye());
    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('assign_courier'),
      mesaj: this.langService.translate('assign_courier_confirm_message', { name: kurye?.adSoyad ?? '' }),
      onayMetni: this.langService.translate('assign'),
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.kuryeAta(this.gonderiId, this.secilenKurye());
      this.gonderi.set(g);
      this.notification.success(this.langService.translate('assigned_success'));
      this.secilenKurye.set('');
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : this.langService.translate('courier_assignment_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async durumDegistir(yeniStatus: ShipmentStatus): Promise<void> {
    if (yeniStatus === 'teslim-edildi' && !this.kanit()) {
      this.notification.error(this.langService.translate('add_proof_first'));
      return;
    }

    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('status_change_title'),
      mesaj: this.langService.translate('status_change_message', { status: this.langService.translate('status_' + yeniStatus.replace(/-/g, '_')) }),
      aciklamaGerekli: true,
      onayMetni: this.langService.translate('update_status'),
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.durumDegistir(this.gonderiId, yeniStatus, sonuc.aciklama ?? '');
      this.gonderi.set(g);
      this.notification.success(this.langService.translate('status_updated'));
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : this.langService.translate('status_update_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async teslimatKanitiKaydet(): Promise<void> {
    if (!this.teslimAlan().trim()) {
      this.notification.error(this.langService.translate('proof_recipient_name_required'));
      return;
    }
    this.islemDevamEdiyor.set(true);
    try {
      await this.shipmentService.teslimatKanitiEkle(this.gonderiId, {
        teslimAlanAdSoyad: this.teslimAlan(),
        imzaVarMi: this.imzaVar(),
        not: this.teslimatNot() || undefined,
      });
      this.notification.success(this.langService.translate('proof_saved_success'));
      this.teslimAlan.set('');
      this.teslimatNot.set('');
    } catch {
      this.notification.error(this.langService.translate('proof_save_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async iadeTalebiAc(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('return_request_title'),
      mesaj: this.langService.translate('return_request_confirm_message'),
      aciklamaGerekli: true,
      onayMetni: this.langService.translate('open_return_request'),
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      await this.shipmentService.iadeTalebiOlustur(this.gonderiId, sonuc.aciklama ?? '');
      await this.yukle();
      this.notification.success(this.langService.translate('return_request_created'));
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : this.langService.translate('return_request_create_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  async iptalEt(): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('cancel_shipment_title'),
      mesaj: this.langService.translate('cancel_shipment_confirm_message'),
      aciklamaGerekli: true,
      onayMetni: this.langService.translate('cancel_shipment'),
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(true);
    try {
      const g = await this.shipmentService.iptalEt(this.gonderiId, sonuc.aciklama ?? '');
      this.gonderi.set(g);
      this.notification.success(this.langService.translate('shipment_canceled'));
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : this.langService.translate('shipment_cancel_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  duzenle(): void {
    this.router.navigate(['/gonderiler', this.gonderiId, 'duzenle']);
  }

  async musteriNotuEkle(): Promise<void> {
    const not = this.musteriNotu().trim();
    if (!not) {
      this.notification.error(this.langService.translate('note_required'));
      return;
    }
    this.islemDevamEdiyor.set(true);
    try {
      await this.shipmentService.musteriNotuEkle(this.gonderiId, not);
      this.notification.success(this.langService.translate('note_saved'));
      this.musteriNotu.set('');
    } catch {
      this.notification.error(this.langService.translate('note_save_failed'));
    } finally {
      this.islemDevamEdiyor.set(false);
    }
  }

  yazdir(): void {
    window.print();
  }
}
