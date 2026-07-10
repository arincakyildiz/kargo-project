import { TestBed } from '@angular/core/testing';
import { ShipmentService, BusinessRuleError } from './shipment.service';
import { CourierService } from './courier.service';
import { ZoneService } from './zone.service';
import { DeliveryProofService } from './delivery-proof.service';
import { AssignmentService } from './assignment.service';

describe('ShipmentService', () => {
  let shipmentService: ShipmentService;
  let courierService: CourierService;
  let zoneService: ZoneService;
  let proofService: DeliveryProofService;
  let assignmentService: AssignmentService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    shipmentService = TestBed.inject(ShipmentService);
    courierService = TestBed.inject(CourierService);
    zoneService = TestBed.inject(ZoneService);
    proofService = TestBed.inject(DeliveryProofService);
    assignmentService = TestBed.inject(AssignmentService);
  });

  it('yeni gönderi "olusturuldu" durumuyla oluşturulur', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'Test Alıcı',
      aliciTelefon: '0532 111 22 33',
      adresId: 'adr-1',
      bolgeId: zone.id,
      agirlikKg: 1,
    });
    expect(gonderi.status).toBe('olusturuldu');
    expect(gonderi.takipKodu).toMatch(/^TK-/);
  });

  it('tanımsız durum geçişini reddeder (olusturuldu -> teslim-edildi)', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'Test Alıcı',
      aliciTelefon: '0532 111 22 33',
      adresId: 'adr-1',
      bolgeId: zone.id,
      agirlikKg: 1,
    });

    await expectAsync(
      shipmentService.durumDegistir(gonderi.id, 'teslim-edildi', 'geçersiz geçiş denemesi')
    ).toBeRejectedWithError(BusinessRuleError);
  });

  it('kurye günlük kapasitesinin üzerinde gönderi alamaz', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const kurye = await courierService.olustur({
      adSoyad: 'Kapasite Testi',
      telefon: '0532 000 00 00',
      bolgeId: zone.id,
      gunlukKapasite: 1,
      aktifMi: true,
    });

    const g1 = await shipmentService.olustur({
      aliciAdSoyad: 'A', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zone.id, agirlikKg: 1,
    });
    const g2 = await shipmentService.olustur({
      aliciAdSoyad: 'B', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zone.id, agirlikKg: 1,
    });

    await shipmentService.kuryeAta(g1.id, kurye.id);

    await expectAsync(shipmentService.kuryeAta(g2.id, kurye.id)).toBeRejectedWithError(
      BusinessRuleError,
      /kapasitesinin/
    );
  });

  it('bölgesi uyuşmayan kuryeye atama yapılamaz', async () => {
    const zonlar = zoneService.aktifBolgeler();
    const kurye = await courierService.olustur({
      adSoyad: 'Farklı Bölge',
      telefon: '0532 000 00 00',
      bolgeId: zonlar[1].id,
      gunlukKapasite: 5,
      aktifMi: true,
    });
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'A', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zonlar[0].id, agirlikKg: 1,
    });

    await expectAsync(shipmentService.kuryeAta(gonderi.id, kurye.id)).toBeRejectedWithError(
      BusinessRuleError,
      /bölgesi/
    );
  });

  it('teslimat kanıtı olmadan "teslim edildi" durumuna geçilemez', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const kurye = await courierService.olustur({
      adSoyad: 'Kurye', telefon: '0532 000 00 00', bolgeId: zone.id, gunlukKapasite: 5, aktifMi: true,
    });
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'A', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zone.id, agirlikKg: 1,
    });
    await shipmentService.kuryeAta(gonderi.id, kurye.id);
    await shipmentService.durumDegistir(gonderi.id, 'dagitimda', 'yola çıktı');

    await expectAsync(
      shipmentService.durumDegistir(gonderi.id, 'teslim-edildi', 'teslim edildi')
    ).toBeRejectedWithError(BusinessRuleError, /teslimat kanıtı/);

    await shipmentService.teslimatKanitiEkle(gonderi.id, { teslimAlanAdSoyad: 'Alıcı', imzaVarMi: true });
    expect(proofService.gonderiKaniti(gonderi.id)).toBeDefined();

    const guncel = await shipmentService.durumDegistir(gonderi.id, 'teslim-edildi', 'teslim edildi');
    expect(guncel.status).toBe('teslim-edildi');
  });

  it('iptal edilen gönderi tekrar aktifleştirilemez', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'A', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zone.id, agirlikKg: 1,
    });
    const iptalEdilen = await shipmentService.iptalEt(gonderi.id, 'müşteri talebi');
    expect(iptalEdilen.status).toBe('iptal-edildi');

    await expectAsync(
      shipmentService.durumDegistir(gonderi.id, 'kurye-atandi', 'tekrar aktifleştirme denemesi')
    ).toBeRejectedWithError(BusinessRuleError);
  });

  it('kurye atandığında aktif Assignment kaydı üretilir, iptalde pasifleşir', async () => {
    const zone = zoneService.aktifBolgeler()[0];
    const kurye = await courierService.olustur({
      adSoyad: 'Atama Testi', telefon: '0532 000 00 00', bolgeId: zone.id, gunlukKapasite: 5, aktifMi: true,
    });
    const gonderi = await shipmentService.olustur({
      aliciAdSoyad: 'A', aliciTelefon: '0532 111 22 33', adresId: 'adr-1', bolgeId: zone.id, agirlikKg: 1,
    });

    await shipmentService.kuryeAta(gonderi.id, kurye.id);
    const atama = assignmentService.aktifAtama(gonderi.id);
    expect(atama).toBeDefined();
    expect(atama?.kuryeId).toBe(kurye.id);
    expect(atama?.aktifMi).toBeTrue();

    await shipmentService.iptalEt(gonderi.id, 'iptal');
    expect(assignmentService.aktifAtama(gonderi.id)).toBeUndefined();
  });
});
