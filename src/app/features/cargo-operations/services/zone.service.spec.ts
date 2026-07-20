import { TestBed } from '@angular/core/testing';
import { ZoneService } from './zone.service';

describe('ZoneService', () => {
  let zoneService: ZoneService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    zoneService = TestBed.inject(ZoneService);
  });

  it('yeni bölge oluşturulur ve listeye eklenir', async () => {
    const zone = await zoneService.olustur({ ad: 'Test Bölge', il: 'Ankara', ilce: 'Çankaya', aktifMi: true });
    expect(zone.id).toBeTruthy();
    expect(zoneService.liste().find((z) => z.id === zone.id)).toBeTruthy();
  });

  it('aktifBolgeler yalnızca aktifMi=true olan bölgeleri döner', async () => {
    const aktif = await zoneService.olustur({ ad: 'Aktif', il: 'Ankara', ilce: 'Çankaya', aktifMi: true });
    const pasif = await zoneService.olustur({ ad: 'Pasif', il: 'Ankara', ilce: 'Çankaya', aktifMi: false });

    const aktifIdler = zoneService.aktifBolgeler().map((z) => z.id);
    expect(aktifIdler).toContain(aktif.id);
    expect(aktifIdler).not.toContain(pasif.id);
  });

  it('sil() bölgeyi listeden kaldırır', async () => {
    const zone = await zoneService.olustur({ ad: 'Silinecek', il: 'Ankara', ilce: 'Çankaya', aktifMi: true });
    expect(zoneService.liste().find((z) => z.id === zone.id)).toBeTruthy();

    await zoneService.sil(zone.id);
    expect(zoneService.liste().find((z) => z.id === zone.id)).toBeFalsy();
  });
});
