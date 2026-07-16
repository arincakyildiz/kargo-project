import { TestBed } from '@angular/core/testing';
import { CourierService } from './courier.service';

describe('CourierService', () => {
  let courierService: CourierService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    courierService = TestBed.inject(CourierService);
  });

  it('yeni kurye "aktifMi: true" ile oluşturulur ve listeye eklenir', async () => {
    const kurye = await courierService.olustur({
      adSoyad: 'Test Kurye',
      telefon: '0532 000 00 00',
      bolgeId: 'zon-1',
      gunlukKapasite: 10,
      aktifMi: true,
    });
    expect(kurye.id).toBeTruthy();
    expect(courierService.liste().find((k) => k.id === kurye.id)).toBeTruthy();
  });

  it('aktifKuryeler yalnızca aktifMi=true olan kuryeleri döner', async () => {
    const aktif = await courierService.olustur({
      adSoyad: 'Aktif Kurye', telefon: '0532 111 11 11', bolgeId: 'zon-1', gunlukKapasite: 10, aktifMi: true,
    });
    const pasif = await courierService.olustur({
      adSoyad: 'Pasif Kurye', telefon: '0532 222 22 22', bolgeId: 'zon-1', gunlukKapasite: 10, aktifMi: false,
    });

    const aktifIdler = courierService.aktifKuryeler().map((k) => k.id);
    expect(aktifIdler).toContain(aktif.id);
    expect(aktifIdler).not.toContain(pasif.id);
  });

  it('kurye pasife alınınca genel listede kalır ama aktifKuryeler\'den çıkar', async () => {
    const kurye = await courierService.olustur({
      adSoyad: 'Değişken Kurye', telefon: '0532 333 33 33', bolgeId: 'zon-1', gunlukKapasite: 10, aktifMi: true,
    });

    await courierService.guncelle(kurye.id, { aktifMi: false });

    expect(courierService.liste().find((k) => k.id === kurye.id)).toBeTruthy();
    expect(courierService.aktifKuryeler().find((k) => k.id === kurye.id)).toBeFalsy();

    await courierService.guncelle(kurye.id, { aktifMi: true });
    expect(courierService.aktifKuryeler().find((k) => k.id === kurye.id)).toBeTruthy();
  });
});
