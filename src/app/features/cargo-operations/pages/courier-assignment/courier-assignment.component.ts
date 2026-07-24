import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShipmentService, BusinessRuleError } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { DEMO_ERROR_RATE } from '../../../../core/services/mock-api';
import { Courier, CourierCapacity } from '../../models/courier.model';
import { Shipment } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { telefonValidator, pozitifSayiValidator, tamSayiValidator } from '../../../../shared/validators/telefon.validator';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { TelefonMaskDirective } from '../../../../shared/directives/telefon-mask.directive';
import { NoWheelDirective } from '../../../../shared/directives/no-wheel.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

type KuryeSiralamaAnahtari = 'adSoyad-asc' | 'doluluk-desc';
type GonderiSiralamaAnahtari = 'takipKodu-asc' | 'createdAt-desc';

const SAYFA_BOYU_SECENEKLERI = [10, 20, 50, 100];

@Component({
  selector: 'app-courier-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent, YetkiDirective, DebounceDirective, TelefonMaskDirective, NoWheelDirective, TranslatePipe],
  templateUrl: './courier-assignment.component.html',
  styleUrl: './courier-assignment.component.scss',
})
export class CourierAssignmentComponent {
  readonly yukleniyor = signal(true);
  readonly hataMesaji = signal<string | null>(null);
  readonly bekleyenler = signal<Shipment[]>([]);
  readonly secimler = signal<Record<string, string>>({});
  readonly islemDevamEdiyor = signal<string | null>(null);

  readonly kuryeFormAcik = signal(false);
  readonly duzenlenenKuryeId = signal<string | null>(null);
  readonly kuryeKaydediliyor = signal(false);

  readonly kuryeArama = signal('');
  readonly kuryeBolgeFiltre = signal<string>('tumu');
  readonly kuryeStatusFiltre = signal<string>('tumu'); // 'tumu' | 'aktif' | 'pasif'
  readonly kuryeSiralama = signal<KuryeSiralamaAnahtari>('adSoyad-asc');
  readonly kuryeSayfa = signal(1);
  readonly kuryeSayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[0]);

  readonly gonderiArama = signal('');
  readonly gonderiBolgeFiltre = signal<string>('tumu');
  readonly gonderiSiralama = signal<GonderiSiralamaAnahtari>('createdAt-desc');
  readonly gonderiSayfa = signal(1);
  readonly gonderiSayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[0]);

  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;

  readonly kuryeForm = this.fb.nonNullable.group({
    adSoyad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    telefon: ['', [Validators.required, telefonValidator(), Validators.maxLength(15)]],
    bolgeId: ['', Validators.required],
    // Boş bırakılınca "zorunlu" hatasının doğru tetiklenmesi için null'a izin veren FormControl.
    gunlukKapasite: new FormControl<number | null>(10, {
      validators: [Validators.required, pozitifSayiValidator(), tamSayiValidator(), Validators.max(200)],
    }),
  });

  private readonly kuryeSiralamaFonksiyonlari: Record<
    KuryeSiralamaAnahtari,
    (a: { kurye: Courier; doluluk: number }, b: { kurye: Courier; doluluk: number }) => number
  > = {
    'adSoyad-asc': (a, b) => a.kurye.adSoyad.localeCompare(b.kurye.adSoyad),
    'doluluk-desc': (a, b) => b.doluluk - a.doluluk,
  };

  private readonly gonderiSiralamaFonksiyonlari: Record<GonderiSiralamaAnahtari, (a: Shipment, b: Shipment) => number> = {
    'takipKodu-asc': (a, b) => a.takipKodu.localeCompare(b.takipKodu),
    'createdAt-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
  };

  readonly kuryeKapasiteOzeti = computed<Array<{ kurye: Courier; kapasite: CourierCapacity; doluluk: number }>>(() => {
    const bugun = new Date().toISOString().slice(0, 10);
    const aramaMetni = this.kuryeArama().trim().toLowerCase();
    const bolgeFiltre = this.kuryeBolgeFiltre();
    const statusFiltre = this.kuryeStatusFiltre();

    return this.courierService.liste()
      .filter((k) => {
        if (statusFiltre === 'aktif' && !k.aktifMi) return false;
        if (statusFiltre === 'pasif' && k.aktifMi) return false;
        if (bolgeFiltre !== 'tumu' && k.bolgeId !== bolgeFiltre) return false;
        if (aramaMetni && !k.adSoyad.toLowerCase().includes(aramaMetni)) return false;
        return true;
      })
      .map((k) => {
        const atanan = this.shipmentService
          .liste()
          .filter((s) => s.kuryeId === k.id && ['kurye-atandi', 'dagitimda'].includes(s.status)).length;
        const kapasite: CourierCapacity = {
          kuryeId: k.id,
          tarih: bugun,
          kapasite: k.gunlukKapasite,
          atananGonderiSayisi: atanan,
        };
        return { kurye: k, kapasite, doluluk: Math.round((atanan / k.gunlukKapasite) * 100) };
      })
      .sort(this.kuryeSiralamaFonksiyonlari[this.kuryeSiralama()]);
  });

  readonly kuryeToplamSayfa = computed(() => Math.max(1, Math.ceil(this.kuryeKapasiteOzeti().length / this.kuryeSayfaBoyu())));
  readonly kuryeGecerliSayfa = computed(() => Math.min(this.kuryeSayfa(), this.kuryeToplamSayfa()));
  readonly kuryeSayfalanmis = computed(() => {
    const baslangic = (this.kuryeGecerliSayfa() - 1) * this.kuryeSayfaBoyu();
    return this.kuryeKapasiteOzeti().slice(baslangic, baslangic + this.kuryeSayfaBoyu());
  });

  readonly filtrelenmisBekleyenler = computed(() => {
    const aramaMetni = this.gonderiArama().trim().toLowerCase();
    const bolgeFiltre = this.gonderiBolgeFiltre();

    return this.bekleyenler()
      .filter((s) => {
        if (bolgeFiltre !== 'tumu' && s.bolgeId !== bolgeFiltre) return false;
        if (aramaMetni && !s.takipKodu.toLowerCase().includes(aramaMetni) && !s.aliciAdSoyad.toLowerCase().includes(aramaMetni)) return false;
        return true;
      })
      .sort(this.gonderiSiralamaFonksiyonlari[this.gonderiSiralama()]);
  });

  readonly gonderiToplamSayfa = computed(() => Math.max(1, Math.ceil(this.filtrelenmisBekleyenler().length / this.gonderiSayfaBoyu())));
  readonly gonderiGecerliSayfa = computed(() => Math.min(this.gonderiSayfa(), this.gonderiToplamSayfa()));
  readonly gonderiSayfalanmis = computed(() => {
    const baslangic = (this.gonderiGecerliSayfa() - 1) * this.gonderiSayfaBoyu();
    return this.filtrelenmisBekleyenler().slice(baslangic, baslangic + this.gonderiSayfaBoyu());
  });

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private notification: NotificationService,
    private audit: AuditService,
    private currentUser: CurrentUserService,
    private dialog: DialogService,
    private langService: LanguageService
  ) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    this.hataMesaji.set(null);
    try {
      await Promise.all([this.zoneService.tumunuGetir(), this.courierService.tumunuGetir()]);
      const liste = await this.shipmentService.tumunuGetir(DEMO_ERROR_RATE);
      this.bekleyenler.set(liste.filter((s) => s.status === 'olusturuldu'));
    } catch {
      this.hataMesaji.set(this.langService.translate('error_loading_courier_assignment'));
    } finally {
      this.yukleniyor.set(false);
    }
  }

  uygunKuryeler(bolgeId: string) {
    return this.courierService.aktifKuryeler().filter((k) => k.bolgeId === bolgeId);
  }

  secimYap(shipmentId: string, kuryeId: string): void {
    this.secimler.update((s) => ({ ...s, [shipmentId]: kuryeId }));
  }

  async ata(shipment: Shipment): Promise<void> {
    const kuryeId = this.secimler()[shipment.id];
    if (!kuryeId) {
      this.notification.error(this.langService.translate('select_courier_required'));
      return;
    }
    const kurye = this.courierService.aktifKuryeler().find((k) => k.id === kuryeId);
    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('assign_courier'),
      mesaj: this.langService.translate('assign_courier_shipment_confirm_message', { code: shipment.takipKodu, name: kurye?.adSoyad ?? kuryeId }),
      onayMetni: this.langService.translate('assign'),
    });
    if (!sonuc.onaylandi) return;

    this.islemDevamEdiyor.set(shipment.id);
    try {
      await this.shipmentService.kuryeAta(shipment.id, kuryeId);
      this.notification.success(this.langService.translate('courier_assigned_for_shipment', { code: shipment.takipKodu }));
      await this.yukle();
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : this.langService.translate('courier_assignment_failed'));
    } finally {
      this.islemDevamEdiyor.set(null);
    }
  }

  yeniKuryeFormAc(): void {
    this.duzenlenenKuryeId.set(null);
    this.kuryeForm.reset({ adSoyad: '', telefon: '', bolgeId: '', gunlukKapasite: 10 });
    this.kuryeFormAcik.set(true);
  }

  kuryeDuzenleFormuAc(kurye: Courier): void {
    this.duzenlenenKuryeId.set(kurye.id);
    this.kuryeForm.reset({
      adSoyad: kurye.adSoyad,
      telefon: kurye.telefon,
      bolgeId: kurye.bolgeId,
      gunlukKapasite: kurye.gunlukKapasite,
    });
    this.kuryeFormAcik.set(true);
  }

  async kuryeFormunuKapat(): Promise<void> {
    if (this.kuryeForm.dirty) {
      const sonuc = await this.dialog.confirm({
        baslik: this.langService.translate('unsaved_title'),
        mesaj: this.langService.translate('unsaved_message'),
        onayMetni: this.langService.translate('unsaved_exit'),
      });
      if (!sonuc.onaylandi) return;
    }
    this.kuryeForm.reset();
    this.kuryeFormAcik.set(false);
  }

  kapasiteGirdisiDegisti(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, ''); // Sadece rakamları tut (ondalık nokta, e, artı, eksi engellenir)
    if (val) {
      let num = parseInt(val, 10);
      if (num > 200) num = 200;
      if (num < 1) num = 1;
      input.value = num.toString();
      this.kuryeForm.controls.gunlukKapasite.setValue(num);
    } else {
      this.kuryeForm.controls.gunlukKapasite.setValue(null);
    }
  }

  async kuryeKaydet(): Promise<void> {
    if (this.kuryeForm.invalid) {
      this.kuryeForm.markAllAsTouched();
      return;
    }
    this.kuryeKaydediliyor.set(true);
    try {
      const formVeri = this.kuryeForm.getRawValue();
      // this.kuryeForm.invalid kontrolünden geçildiği için gunlukKapasite burada asla null değildir.
      const veri = { ...formVeri, gunlukKapasite: formVeri.gunlukKapasite ?? 0 };
      if (this.duzenlenenKuryeId()) {
        await this.courierService.guncelle(this.duzenlenenKuryeId()!, veri);
        this.notification.success(this.langService.translate('courier_updated'));
      } else {
        await this.courierService.olustur({ ...veri, aktifMi: true });
        this.notification.success(this.langService.translate('courier_created'));
      }
      this.audit.kaydet({
        islemTipi: 'kurye-kaydet',
        rol: this.currentUser.rol(),
        aciklama: `Kurye kaydedildi: ${veri.adSoyad}`,
      });
      this.kuryeFormAcik.set(false);
      await this.yukle();
    } catch {
      this.notification.error(this.langService.translate('error_saving_courier'));
    } finally {
      this.kuryeKaydediliyor.set(false);
    }
  }

  async kuryeAktiflikDegistir(kurye: Courier): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate(kurye.aktifMi ? 'deactivate_courier_title' : 'activate_courier_title'),
      mesaj: this.langService.translate(kurye.aktifMi ? 'deactivate_courier_confirm' : 'activate_courier_confirm', { name: kurye.adSoyad }),
      aciklamaGerekli: true,
      onayMetni: this.langService.translate('confirm'),
    });
    if (!sonuc.onaylandi) return;

    try {
      await this.courierService.guncelle(kurye.id, { aktifMi: !kurye.aktifMi });
      this.audit.kaydet({
        islemTipi: 'kurye-durum',
        rol: this.currentUser.rol(),
        aciklama: `${kurye.adSoyad} ${!kurye.aktifMi ? 'aktif' : 'pasif'} yapıldı. ${sonuc.aciklama}`,
        hedefId: kurye.id,
      });
      this.notification.success(this.langService.translate('courier_status_updated'));
      await this.yukle();
    } catch {
      this.notification.error(this.langService.translate('courier_status_update_failed'));
    }
  }

  async kuryeSil(kurye: Courier): Promise<void> {
    const kontrol = this.shipmentService.kuryeSilinebilirMi(kurye.id);
    if (kontrol.aktifGonderiSayisi > 0) {
      this.notification.error(this.langService.translate('cannot_delete_courier_active_shipments', { count: kontrol.aktifGonderiSayisi }));
      return;
    }

    const sonuc = await this.dialog.confirm({
      baslik: this.langService.translate('delete_courier_title'),
      mesaj: this.langService.translate('delete_courier_confirm_message', { name: kurye.adSoyad }),
      onayMetni: this.langService.translate('delete'),
    });
    if (!sonuc.onaylandi) return;

    try {
      await this.courierService.sil(kurye.id);
      this.audit.kaydet({
        islemTipi: 'kurye-sil',
        rol: this.currentUser.rol(),
        aciklama: `Kurye silindi: ${kurye.adSoyad}`,
      });
      this.notification.success(this.langService.translate('courier_deleted_success'));
      await this.yukle();
    } catch {
      this.notification.error(this.langService.translate('courier_delete_failed'));
    }
  }

  kuryeAramaDegisti(deger: string): void {
    this.kuryeArama.set(deger);
    this.kuryeSayfa.set(1);
  }

  kuryeBolgeFiltresiDegisti(bolgeId: string): void {
    this.kuryeBolgeFiltre.set(bolgeId);
    this.kuryeSayfa.set(1);
  }

  kuryeStatusFiltresiDegisti(status: string): void {
    this.kuryeStatusFiltre.set(status);
    this.kuryeSayfa.set(1);
  }

  kuryeSiralamaDegisti(deger: string): void {
    this.kuryeSiralama.set(deger as KuryeSiralamaAnahtari);
    this.kuryeSayfa.set(1);
  }

  kuryeSayfaBoyuDegisti(deger: string): void {
    this.kuryeSayfaBoyu.set(Number(deger));
    this.kuryeSayfa.set(1);
  }

  kuryeSayfayaGit(yeniSayfa: number): void {
    if (yeniSayfa < 1 || yeniSayfa > this.kuryeToplamSayfa()) return;
    this.kuryeSayfa.set(yeniSayfa);
  }

  gonderiAramaDegisti(deger: string): void {
    this.gonderiArama.set(deger);
    this.gonderiSayfa.set(1);
  }

  gonderiBolgeFiltresiDegisti(bolgeId: string): void {
    this.gonderiBolgeFiltre.set(bolgeId);
    this.gonderiSayfa.set(1);
  }

  gonderiSiralamaDegisti(deger: string): void {
    this.gonderiSiralama.set(deger as GonderiSiralamaAnahtari);
    this.gonderiSayfa.set(1);
  }

  gonderiSayfaBoyuDegisti(deger: string): void {
    this.gonderiSayfaBoyu.set(Number(deger));
    this.gonderiSayfa.set(1);
  }

  gonderiSayfayaGit(yeniSayfa: number): void {
    if (yeniSayfa < 1 || yeniSayfa > this.gonderiToplamSayfa()) return;
    this.gonderiSayfa.set(yeniSayfa);
  }
}
