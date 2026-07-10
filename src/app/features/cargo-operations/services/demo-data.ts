import { Courier } from '../models/courier.model';
import { Shipment, StatusHistoryEntry } from '../models/shipment.model';
import { CustomerAddress, DeliveryZone } from '../models/zone.model';

function iso(gunOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + gunOffset);
  return d.toISOString();
}

export function demoZones(): DeliveryZone[] {
  const now = iso(-20);
  return [
    { id: 'zon-1', ad: 'Kadıköy', il: 'İstanbul', ilce: 'Kadıköy', aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'zon-2', ad: 'Beşiktaş', il: 'İstanbul', ilce: 'Beşiktaş', aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'zon-3', ad: 'Çankaya', il: 'Ankara', ilce: 'Çankaya', aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'zon-4', ad: 'Konak', il: 'İzmir', ilce: 'Konak', aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'zon-5', ad: 'Nilüfer', il: 'Bursa', ilce: 'Nilüfer', aktifMi: false, createdAt: now, updatedAt: now },
  ];
}

export function demoCouriers(): Courier[] {
  const now = iso(-20);
  return [
    { id: 'kur-1', adSoyad: 'Mehmet Yıldız', telefon: '0532 111 22 33', bolgeId: 'zon-1', gunlukKapasite: 12, aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'kur-2', adSoyad: 'Ayşe Kara', telefon: '0533 222 33 44', bolgeId: 'zon-2', gunlukKapasite: 10, aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'kur-3', adSoyad: 'Burak Şahin', telefon: '0535 333 44 55', bolgeId: 'zon-3', gunlukKapasite: 15, aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'kur-4', adSoyad: 'Deniz Aydın', telefon: '0536 444 55 66', bolgeId: 'zon-4', gunlukKapasite: 8, aktifMi: true, createdAt: now, updatedAt: now },
    { id: 'kur-5', adSoyad: 'Cem Polat', telefon: '0537 555 66 77', bolgeId: 'zon-1', gunlukKapasite: 12, aktifMi: false, createdAt: now, updatedAt: now },
  ];
}

export function demoAddresses(): CustomerAddress[] {
  const now = iso(-20);
  return [
    { id: 'adr-1', aliciAdSoyad: 'Zeynep Demir', telefon: '0541 111 11 11', acikAdres: 'Caferağa Mah. Moda Cad. No:12 Kadıköy', bolgeId: 'zon-1', createdAt: now, updatedAt: now },
    { id: 'adr-2', aliciAdSoyad: 'Ali Vural', telefon: '0542 222 22 22', acikAdres: 'Levent Mah. Büyükdere Cad. No:45 Beşiktaş', bolgeId: 'zon-2', createdAt: now, updatedAt: now },
    { id: 'adr-3', aliciAdSoyad: 'Selin Er', telefon: '0543 333 33 33', acikAdres: 'Kızılay Mah. Atatürk Blv. No:8 Çankaya', bolgeId: 'zon-3', createdAt: now, updatedAt: now },
    { id: 'adr-4', aliciAdSoyad: 'Emre Koç', telefon: '0544 444 44 44', acikAdres: 'Alsancak Mah. Kıbrıs Şehitleri Cad. No:20 Konak', bolgeId: 'zon-4', createdAt: now, updatedAt: now },
    { id: 'adr-5', aliciAdSoyad: 'Nazlı Öz', telefon: '0545 555 55 55', acikAdres: 'Bahariye Cad. No:30 Kadıköy', bolgeId: 'zon-1', createdAt: now, updatedAt: now },
    { id: 'adr-6', aliciAdSoyad: 'Ozan Kaya', telefon: '0546 666 66 66', acikAdres: 'Etiler Mah. Nispetiye Cad. No:5 Beşiktaş', bolgeId: 'zon-2', createdAt: now, updatedAt: now },
  ];
}

export function demoShipments(): Shipment[] {
  const rows: Array<[string, string, string, string, string, number, Shipment['status'], number, string | undefined]> = [
    ['gnd-1', 'TK-100234', 'adr-1', 'zon-1', 'kur-1', 2.4, 'teslim-edildi', -6, 'Kırılabilir ürün'],
    ['gnd-2', 'TK-100235', 'adr-2', 'zon-2', 'kur-2', 1.1, 'dagitimda', -1, undefined],
    ['gnd-3', 'TK-100236', 'adr-3', 'zon-3', 'kur-3', 5.0, 'kurye-atandi', -1, undefined],
    ['gnd-4', 'TK-100237', 'adr-4', 'zon-4', 'kur-4', 0.8, 'olusturuldu', 0, undefined],
    ['gnd-5', 'TK-100238', 'adr-5', 'zon-1', 'kur-1', 3.2, 'teslim-edilemedi', -3, 'Alıcı adreste bulunamadı'],
    ['gnd-6', 'TK-100239', 'adr-6', 'zon-2', 'kur-2', 1.6, 'iade-talebi', -4, 'Yanlış ürün gönderildi'],
    ['gnd-7', 'TK-100240', 'adr-1', 'zon-1', 'kur-1', 4.5, 'iade-edildi', -8, undefined],
    ['gnd-8', 'TK-100241', 'adr-3', 'zon-3', 'kur-3', 0.5, 'iptal-edildi', -5, 'Müşteri talebiyle iptal'],
    ['gnd-9', 'TK-100242', 'adr-4', 'zon-4', 'kur-4', 6.1, 'teslim-edildi', -10, undefined],
    ['gnd-10', 'TK-100243', 'adr-2', 'zon-2', 'kur-2', 2.0, 'dagitimda', -2, undefined],
    ['gnd-11', 'TK-100244', 'adr-5', 'zon-1', undefined as unknown as string, 1.3, 'olusturuldu', -1, undefined],
    ['gnd-12', 'TK-100245', 'adr-6', 'zon-2', 'kur-2', 3.7, 'teslim-edildi', -12, undefined],
  ];

  return rows.map(([id, takipKodu, adresId, bolgeId, kuryeId, agirlikKg, status, gunOffset, aciklama]) => ({
    id,
    takipKodu,
    aliciAdSoyad: demoAddresses().find((a) => a.id === adresId)?.aliciAdSoyad ?? '',
    aliciTelefon: demoAddresses().find((a) => a.id === adresId)?.telefon ?? '',
    adresId,
    bolgeId,
    kuryeId: kuryeId || undefined,
    agirlikKg,
    aciklama,
    status,
    createdAt: iso(gunOffset - 1),
    updatedAt: iso(gunOffset),
  }));
}

export function demoStatusHistory(): StatusHistoryEntry[] {
  const shipments = demoShipments();
  const history: StatusHistoryEntry[] = [];
  for (const s of shipments) {
    history.push({
      id: crypto.randomUUID(),
      shipmentId: s.id,
      eskiStatus: null,
      yeniStatus: 'olusturuldu',
      aciklama: 'Gönderi kaydı oluşturuldu.',
      islemZamani: s.createdAt,
      islemYapanRol: 'operasyon-uzmani',
    });
    if (s.status !== 'olusturuldu') {
      history.push({
        id: crypto.randomUUID(),
        shipmentId: s.id,
        eskiStatus: 'olusturuldu',
        yeniStatus: s.status,
        aciklama: 'Demo veri: durum güncellendi.',
        islemZamani: s.updatedAt,
        islemYapanRol: 'kurye-sorumlusu',
      });
    }
  }
  return history;
}
