import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { ZoneService } from '../../services/zone.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuditService } from '../../../../core/services/audit.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { telefonValidator, pozitifSayiValidator } from '../../../../shared/validators/telefon.validator';
import { TelefonMaskDirective } from '../../../../shared/directives/telefon-mask.directive';
import { NoWheelDirective } from '../../../../shared/directives/no-wheel.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-shipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TelefonMaskDirective, NoWheelDirective, TranslatePipe],
  templateUrl: './shipment-form.component.html',
  styleUrl: './shipment-form.component.scss',
})
export class ShipmentFormComponent implements OnInit, CanComponentDeactivate {
  readonly duzenlemeModu = signal(false);
  readonly yukleniyor = signal(false);
  readonly kaydediliyor = signal(false);
  readonly kaydedildi = signal(false);
  readonly hataMesaji = signal<string | null>(null);
  readonly yeniAdresModu = signal(false);
  private gonderiId: string | null = null;

  readonly adresler = this.zoneService.adresListe;
  readonly bolgeler = this.zoneService.aktifBolgeler;

  readonly form = this.fb.nonNullable.group({
    adresId: ['', Validators.required],
    acikAdres: ['', Validators.maxLength(150)],
    aliciAdSoyad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    aliciTelefon: ['', [Validators.required, telefonValidator(), Validators.maxLength(15)]],
    bolgeId: ['', Validators.required],
    agirlikKg: [1, [Validators.required, pozitifSayiValidator(), Validators.max(500)]],
    aciklama: ['', Validators.maxLength(100)],
  });

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService,
    private zoneService: ZoneService,
    private notification: NotificationService,
    private audit: AuditService,
    private currentUser: CurrentUserService,
    private route: ActivatedRoute,
    private router: Router,
    private langService: LanguageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.gonderiId = this.route.snapshot.paramMap.get('id');
    await this.zoneService.tumunuGetir();

    if (this.gonderiId) {
      this.duzenlemeModu.set(true);
      this.yukleniyor.set(true);
      const gonderi = await this.shipmentService.birGetir(this.gonderiId);
      this.yukleniyor.set(false);
      if (!gonderi) {
        this.notification.error(this.langService.translate('shipment_not_found'));
        this.router.navigate(['/gonderiler']);
        return;
      }
      this.form.patchValue({
        adresId: gonderi.adresId,
        aliciAdSoyad: gonderi.aliciAdSoyad,
        aliciTelefon: gonderi.aliciTelefon,
        bolgeId: gonderi.bolgeId,
        agirlikKg: gonderi.agirlikKg,
        aciklama: gonderi.aciklama ?? '',
      });
    }
  }

  async adresSecildi(adresId: string): Promise<void> {
    const adres = await this.zoneService.adresGetir(adresId);
    if (adres) {
      this.form.patchValue({
        aliciAdSoyad: adres.aliciAdSoyad,
        aliciTelefon: adres.telefon,
        bolgeId: adres.bolgeId,
      });
    }
  }

  yeniAdresModunuDegistir(): void {
    const yeni = !this.yeniAdresModu();
    this.yeniAdresModu.set(yeni);
    const adresIdControl = this.form.controls.adresId;
    const acikAdresControl = this.form.controls.acikAdres;

    if (yeni) {
      adresIdControl.clearValidators();
      adresIdControl.setValue('');
      acikAdresControl.setValidators([Validators.required, Validators.maxLength(150)]);
    } else {
      adresIdControl.setValidators([Validators.required]);
      acikAdresControl.clearValidators();
      acikAdresControl.setValue('');
    }
    adresIdControl.updateValueAndValidity();
    acikAdresControl.updateValueAndValidity();
  }

  kaydedilmemisDegisiklikVarMi(): boolean {
    return this.form.dirty && !this.kaydedildi();
  }

  async kaydet(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.kaydediliyor.set(true);
    this.hataMesaji.set(null);
    try {
      const veri = this.form.getRawValue();
      let adresId = veri.adresId;

      if (this.yeniAdresModu()) {
        const yeniAdres = await this.zoneService.adresOlustur({
          aliciAdSoyad: veri.aliciAdSoyad,
          telefon: veri.aliciTelefon,
          acikAdres: veri.acikAdres,
          bolgeId: veri.bolgeId,
        });
        adresId = yeniAdres.id;
        this.audit.kaydet({
          islemTipi: 'adres-olustur',
          rol: this.currentUser.rol(),
          aciklama: `Yeni adres eklendi: ${veri.aliciAdSoyad} — ${veri.acikAdres}`,
        });
      }

      const kayitVerisi = {
        aliciAdSoyad: veri.aliciAdSoyad,
        aliciTelefon: veri.aliciTelefon,
        adresId,
        bolgeId: veri.bolgeId,
        agirlikKg: veri.agirlikKg,
        aciklama: veri.aciklama,
      };

      if (this.duzenlemeModu() && this.gonderiId) {
        await this.shipmentService.guncelle(this.gonderiId, kayitVerisi);
        this.notification.success(this.langService.translate('shipment_updated'));
        this.kaydedildi.set(true);
        this.router.navigate(['/gonderiler', this.gonderiId]);
      } else {
        const yeni = await this.shipmentService.olustur(kayitVerisi);
        this.notification.success(this.langService.translate('shipment_created_code', { code: yeni.takipKodu }));
        this.kaydedildi.set(true);
        this.router.navigate(['/gonderiler', yeni.id]);
      }
    } catch {
      this.hataMesaji.set(this.langService.translate('error_saving_try_again'));
    } finally {
      this.kaydediliyor.set(false);
    }
  }
}
