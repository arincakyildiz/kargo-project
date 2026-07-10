import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShipmentService, BusinessRuleError } from '../../services/shipment.service';
import { CourierService } from '../../services/courier.service';
import { ZoneService } from '../../services/zone.service';
import { Courier, CourierCapacity } from '../../models/courier.model';
import { Shipment } from '../../models/shipment.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';
import { telefonValidator, pozitifSayiValidator } from '../../../../shared/validators/telefon.validator';

@Component({
  selector: 'app-courier-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent, YetkiDirective],
  templateUrl: './courier-assignment.component.html',
  styleUrl: './courier-assignment.component.scss',
})
export class CourierAssignmentComponent {
  readonly yukleniyor = signal(true);
  readonly bekleyenler = signal<Shipment[]>([]);
  readonly secimler = signal<Record<string, string>>({});
  readonly islemDevamEdiyor = signal<string | null>(null);

  readonly kuryeFormAcik = signal(false);
  readonly duzenlenenKuryeId = signal<string | null>(null);
  readonly kuryeKaydediliyor = signal(false);

  readonly kuryeForm = this.fb.nonNullable.group({
    adSoyad: ['', [Validators.required, Validators.minLength(3)]],
    telefon: ['', [Validators.required, telefonValidator()]],
    bolgeId: ['', Validators.required],
    gunlukKapasite: [10, [Validators.required, pozitifSayiValidator()]],
  });

  readonly kuryeKapasiteOzeti = computed<Array<{ kurye: Courier; kapasite: CourierCapacity; doluluk: number }>>(() => {
    const bugun = new Date().toISOString().slice(0, 10);
    return this.courierService.aktifKuryeler().map((k) => {
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
    });
  });

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService,
    public courierService: CourierService,
    public zoneService: ZoneService,
    private notification: NotificationService,
    private audit: AuditService,
    private currentUser: CurrentUserService,
    private dialog: DialogService
  ) {
    this.yukle();
  }

  async yukle(): Promise<void> {
    this.yukleniyor.set(true);
    await Promise.all([this.zoneService.tumunuGetir(), this.courierService.tumunuGetir()]);
    const liste = await this.shipmentService.tumunuGetir();
    this.bekleyenler.set(liste.filter((s) => s.status === 'olusturuldu'));
    this.yukleniyor.set(false);
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
      this.notification.error('Lütfen kurye seçin.');
      return;
    }
    this.islemDevamEdiyor.set(shipment.id);
    try {
      await this.shipmentService.kuryeAta(shipment.id, kuryeId);
      this.notification.success(`${shipment.takipKodu} için kurye atandı.`);
      await this.yukle();
    } catch (e) {
      this.notification.error(e instanceof BusinessRuleError ? e.message : 'Kurye ataması başarısız oldu.');
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

  kuryeFormunuKapat(): void {
    this.kuryeFormAcik.set(false);
  }

  async kuryeKaydet(): Promise<void> {
    if (this.kuryeForm.invalid) {
      this.kuryeForm.markAllAsTouched();
      return;
    }
    this.kuryeKaydediliyor.set(true);
    try {
      const veri = this.kuryeForm.getRawValue();
      if (this.duzenlenenKuryeId()) {
        await this.courierService.guncelle(this.duzenlenenKuryeId()!, veri);
        this.notification.success('Kurye güncellendi.');
      } else {
        await this.courierService.olustur({ ...veri, aktifMi: true });
        this.notification.success('Kurye oluşturuldu.');
      }
      this.audit.kaydet({
        islemTipi: 'kurye-kaydet',
        rol: this.currentUser.rol(),
        aciklama: `Kurye kaydedildi: ${veri.adSoyad}`,
      });
      this.kuryeFormAcik.set(false);
      await this.yukle();
    } catch {
      this.notification.error('Kurye kaydedilirken bir hata oluştu.');
    } finally {
      this.kuryeKaydediliyor.set(false);
    }
  }

  async kuryeAktiflikDegistir(kurye: Courier): Promise<void> {
    const sonuc = await this.dialog.confirm({
      baslik: kurye.aktifMi ? 'Kuryeyi Pasife Al' : 'Kuryeyi Aktifleştir',
      mesaj: `"${kurye.adSoyad}" ${kurye.aktifMi ? 'pasife alınacak' : 'aktifleştirilecek'}. Onaylıyor musunuz?`,
      aciklamaGerekli: true,
      onayMetni: 'Onayla',
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
      this.notification.success('Kurye durumu güncellendi.');
      await this.yukle();
    } catch {
      this.notification.error('Kurye durumu güncellenemedi.');
    }
  }
}
