import { Courier } from '../models/courier.model';
import { Assignment, DeliveryProof, ReturnRequest } from '../models/assignment.model';
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
    { id: 'adr-7', aliciAdSoyad: 'Merve Aksoy', telefon: '0547 777 77 77', acikAdres: 'Bağdat Cad. No:210 Kadıköy', bolgeId: 'zon-1', createdAt: now, updatedAt: now },
    { id: 'adr-8', aliciAdSoyad: 'Kaan Ergin', telefon: '0548 888 88 88', acikAdres: 'Tunalı Hilmi Cad. No:66 Çankaya', bolgeId: 'zon-3', createdAt: now, updatedAt: now },
    { id: 'adr-9', aliciAdSoyad: 'Elif Sarı', telefon: '0549 999 99 99', acikAdres: 'Gazi Bulvarı No:14 Konak', bolgeId: 'zon-4', createdAt: now, updatedAt: now },
    { id: 'adr-10', aliciAdSoyad: 'Murat Tekin', telefon: '0531 010 10 10', acikAdres: 'Abbasağa Mah. Yıldız Cad. No:3 Beşiktaş', bolgeId: 'zon-2', createdAt: now, updatedAt: now },
    { id: 'adr-11', aliciAdSoyad: 'Derya Ünal', telefon: '0532 020 20 20', acikAdres: 'Fenerbahçe Mah. Fener Kalamış Cad. No:78 Kadıköy', bolgeId: 'zon-1', createdAt: now, updatedAt: now },
    { id: 'adr-12', aliciAdSoyad: 'Serkan Bulut', telefon: '0533 030 30 30', acikAdres: 'Bahçelievler Mah. 7. Cad. No:25 Çankaya', bolgeId: 'zon-3', createdAt: now, updatedAt: now },
  ];
}

export function demoShipments(): Shipment[] {
  // [id, takipKodu, adresId, bolgeId, kuryeId?, agirlikKg, status, gunOffset, aciklama?]
  const rows: Array<[string, string, string, string, string | undefined, number, Shipment['status'], number, string | undefined]> = [
    ['gnd-1', 'TK-100234', 'adr-1', 'zon-1', 'kur-1', 2.4, 'teslim-edildi', -6, 'Kırılabilir ürün'],
    ['gnd-2', 'TK-100235', 'adr-2', 'zon-2', 'kur-2', 1.1, 'dagitimda', -1, undefined],
    ['gnd-3', 'TK-100236', 'adr-3', 'zon-3', 'kur-3', 5.0, 'kurye-atandi', -1, undefined],
    ['gnd-4', 'TK-100237', 'adr-4', 'zon-4', undefined, 0.8, 'olusturuldu', 0, undefined],
    ['gnd-5', 'TK-100238', 'adr-5', 'zon-1', 'kur-1', 3.2, 'teslim-edilemedi', -3, 'Alıcı adreste bulunamadı'],
    ['gnd-6', 'TK-100239', 'adr-6', 'zon-2', 'kur-2', 1.6, 'iade-talebi', -4, 'Yanlış ürün gönderildi'],
    ['gnd-7', 'TK-100240', 'adr-1', 'zon-1', 'kur-1', 4.5, 'iade-edildi', -8, undefined],
    ['gnd-8', 'TK-100241', 'adr-3', 'zon-3', 'kur-3', 0.5, 'iptal-edildi', -5, 'Müşteri talebiyle iptal'],
    ['gnd-9', 'TK-100242', 'adr-4', 'zon-4', 'kur-4', 6.1, 'teslim-edildi', -10, undefined],
    ['gnd-10', 'TK-100243', 'adr-2', 'zon-2', 'kur-2', 2.0, 'dagitimda', -2, undefined],
    ['gnd-11', 'TK-100244', 'adr-5', 'zon-1', undefined, 1.3, 'olusturuldu', -1, undefined],
    ['gnd-12', 'TK-100245', 'adr-6', 'zon-2', 'kur-2', 3.7, 'teslim-edildi', -12, undefined],
    ['gnd-13', 'TK-100246', 'adr-7', 'zon-1', 'kur-1', 0.9, 'teslim-edildi', -14, undefined],
    ['gnd-14', 'TK-100247', 'adr-8', 'zon-3', 'kur-3', 2.8, 'teslim-edildi', -13, 'Kapıcıya teslim edilebilir'],
    ['gnd-15', 'TK-100248', 'adr-9', 'zon-4', 'kur-4', 7.4, 'dagitimda', -1, 'Büyük koli'],
    ['gnd-16', 'TK-100249', 'adr-10', 'zon-2', 'kur-2', 1.2, 'teslim-edildi', -9, undefined],
    ['gnd-17', 'TK-100250', 'adr-11', 'zon-1', 'kur-1', 3.5, 'kurye-atandi', 0, undefined],
    ['gnd-18', 'TK-100251', 'adr-12', 'zon-3', 'kur-3', 0.4, 'teslim-edildi', -7, 'Zarf'],
    ['gnd-19', 'TK-100252', 'adr-7', 'zon-1', undefined, 2.2, 'olusturuldu', 0, undefined],
    ['gnd-20', 'TK-100253', 'adr-8', 'zon-3', 'kur-3', 4.9, 'teslim-edilemedi', -2, 'Adres eksik, telefonla ulaşılamadı'],
    ['gnd-21', 'TK-100254', 'adr-9', 'zon-4', 'kur-4', 1.8, 'teslim-edildi', -15, undefined],
    ['gnd-22', 'TK-100255', 'adr-10', 'zon-2', 'kur-2', 6.6, 'iade-talebi', -6, 'Hasarlı paket'],
    ['gnd-23', 'TK-100256', 'adr-11', 'zon-1', 'kur-1', 0.7, 'teslim-edildi', -11, undefined],
    ['gnd-24', 'TK-100257', 'adr-12', 'zon-3', 'kur-3', 2.1, 'dagitimda', 0, undefined],
    ['gnd-25', 'TK-100258', 'adr-1', 'zon-1', 'kur-1', 5.3, 'teslim-edildi', -16, undefined],
    ['gnd-26', 'TK-100259', 'adr-2', 'zon-2', 'kur-2', 1.4, 'iptal-edildi', -9, 'Mükerrer kayıt'],
    ['gnd-27', 'TK-100260', 'adr-3', 'zon-3', undefined, 3.0, 'olusturuldu', 0, undefined],
    ['gnd-28', 'TK-100261', 'adr-4', 'zon-4', 'kur-4', 0.6, 'teslim-edildi', -4, undefined],
    ['gnd-29', 'TK-100262', 'adr-5', 'zon-1', 'kur-1', 8.2, 'dagitimda', -1, 'Ağır paket, asansör yok'],
    ['gnd-30', 'TK-100263', 'adr-6', 'zon-2', 'kur-2', 2.7, 'teslim-edildi', -17, undefined],
    ['gnd-31', 'TK-100264', 'adr-7', 'zon-1', 'kur-1', 1.0, 'iade-edildi', -18, 'Beden değişimi'],
    ['gnd-32', 'TK-100265', 'adr-8', 'zon-3', 'kur-3', 4.1, 'teslim-edildi', -19, undefined],
  ];

  const adresler = demoAddresses();
  return rows.map(([id, takipKodu, adresId, bolgeId, kuryeId, agirlikKg, status, gunOffset, aciklama]) => {
    const adres = adresler.find((a) => a.id === adresId);
    return {
      id,
      takipKodu,
      aliciAdSoyad: adres?.aliciAdSoyad ?? '',
      aliciTelefon: adres?.telefon ?? '',
      adresId,
      bolgeId,
      kuryeId,
      agirlikKg,
      aciklama,
      status,
      createdAt: iso(gunOffset - 1),
      updatedAt: iso(gunOffset),
    };
  });
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

/** "Teslim edildi" ve "iade edildi" gönderiler kanıtla teslim edilmiştir. */
export function demoDeliveryProofs(): DeliveryProof[] {
  return demoShipments()
    .filter((s) => ['teslim-edildi', 'iade-talebi', 'iade-edildi'].includes(s.status))
    .map((s) => ({
      id: crypto.randomUUID(),
      shipmentId: s.id,
      teslimAlanAdSoyad: s.aliciAdSoyad,
      imzaVarMi: true,
      not: undefined,
      createdAt: s.updatedAt,
      updatedAt: s.updatedAt,
    }));
}

export function demoReturnRequests(): ReturnRequest[] {
  const nedenler: Record<string, string> = {
    'gnd-6': 'Yanlış ürün gönderildi',
    'gnd-22': 'Hasarlı paket',
    'gnd-7': 'Ürün beğenilmedi',
    'gnd-31': 'Beden değişimi',
  };
  return demoShipments()
    .filter((s) => ['iade-talebi', 'iade-edildi'].includes(s.status))
    .map((s) => ({
      id: crypto.randomUUID(),
      shipmentId: s.id,
      neden: nedenler[s.id] ?? 'Müşteri iade talebi',
      status: s.status === 'iade-edildi' ? ('tamamlandi' as const) : ('beklemede' as const),
      createdAt: s.updatedAt,
      updatedAt: s.updatedAt,
    }));
}

export function demoAssignments(): Assignment[] {
  return demoShipments()
    .filter((s) => s.kuryeId)
    .map((s) => ({
      id: crypto.randomUUID(),
      shipmentId: s.id,
      kuryeId: s.kuryeId!,
      atamaTarihi: s.updatedAt,
      // İptal edilen gönderilerin ataması artık aktif değildir.
      aktifMi: s.status !== 'iptal-edildi',
      iptalNedeni: s.status === 'iptal-edildi' ? 'Gönderi iptal edildi.' : undefined,
      createdAt: s.updatedAt,
      updatedAt: s.updatedAt,
    }));
}
