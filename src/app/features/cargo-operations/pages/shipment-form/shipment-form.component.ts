import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShipmentService } from '../../services/shipment.service';
import { ZoneService } from '../../services/zone.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { telefonValidator, pozitifSayiValidator } from '../../../../shared/validators/telefon.validator';

@Component({
  selector: 'app-shipment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shipment-form.component.html',
  styleUrl: './shipment-form.component.scss',
})
export class ShipmentFormComponent implements OnInit, CanComponentDeactivate {
  readonly duzenlemeModu = signal(false);
  readonly yukleniyor = signal(false);
  readonly kaydediliyor = signal(false);
  readonly kaydedildi = signal(false);
  readonly hataMesaji = signal<string | null>(null);
  private gonderiId: string | null = null;

  readonly adresler = this.zoneService.adresListe;
  readonly bolgeler = this.zoneService.aktifBolgeler;

  readonly form = this.fb.nonNullable.group({
    adresId: ['', Validators.required],
    aliciAdSoyad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    aliciTelefon: ['', [Validators.required, telefonValidator(), Validators.maxLength(15)]],
    bolgeId: ['', Validators.required],
    agirlikKg: [1, [Validators.required, pozitifSayiValidator(), Validators.max(500)]],
    aciklama: ['', Validators.maxLength(200)],
  });

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService,
    private zoneService: ZoneService,
    private notification: NotificationService,
    private route: ActivatedRoute,
    private router: Router
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
        this.notification.error('Gönderi bulunamadı.');
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
      if (this.duzenlemeModu() && this.gonderiId) {
        await this.shipmentService.guncelle(this.gonderiId, veri);
        this.notification.success('Gönderi güncellendi.');
        this.kaydedildi.set(true);
        this.router.navigate(['/gonderiler', this.gonderiId]);
      } else {
        const yeni = await this.shipmentService.olustur(veri);
        this.notification.success(`Gönderi oluşturuldu: ${yeni.takipKodu}`);
        this.kaydedildi.set(true);
        this.router.navigate(['/gonderiler', yeni.id]);
      }
    } catch {
      this.hataMesaji.set('Kayıt sırasında bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      this.kaydediliyor.set(false);
    }
  }
}
