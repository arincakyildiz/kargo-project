import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZoneService } from '../../services/zone.service';
import { DeliveryZone } from '../../models/zone.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { DialogService } from '../../../../shared/components/confirm-dialog/dialog.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { YetkiDirective } from '../../../../shared/directives/yetki.directive';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, YetkiDirective],
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

  readonly form = this.fb.nonNullable.group({
    ad: ['', Validators.required],
    il: ['', Validators.required],
    ilce: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private zoneService: ZoneService,
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
      this.zones.set(await this.zoneService.tumunuGetir());
    } catch {
      this.hataMesaji.set('Bölgeler yüklenirken bir hata oluştu.');
    } finally {
      this.yukleniyor.set(false);
    }
  }

  yeniFormAc(): void {
    this.duzenlenenId.set(null);
    this.form.reset({ ad: '', il: '', ilce: '' });
    this.formAcik.set(true);
  }

  duzenleFormuAc(zone: DeliveryZone): void {
    this.duzenlenenId.set(zone.id);
    this.form.reset({ ad: zone.ad, il: zone.il, ilce: zone.ilce });
    this.formAcik.set(true);
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
    const sonuc = await this.dialog.confirm({
      baslik: zone.aktifMi ? 'Bölgeyi Pasife Al' : 'Bölgeyi Aktifleştir',
      mesaj: `"${zone.ad}" bölgesi ${zone.aktifMi ? 'pasife alınacak' : 'aktifleştirilecek'}. Onaylıyor musunuz?`,
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
}
