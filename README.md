# Kargo Operasyon, Kurye Atama ve Teslimat Takip Paneli

Angular 17 (standalone components) + mock API/localStorage tabanlı ileri seviye staj değerlendirme projesi. Backend yoktur; tüm veri tarayıcının `localStorage`'ında tutulur ve servis katmanı gerçek bir API'yi simüle eder (gecikme + hata ihtimali).

## Kurulum

Proje **Node 22** gerektirir (Angular build araçları Node 23 ile çalışmaz).

```bash
nvm use 22   # veya: export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install
```

## Çalıştırma

```bash
ng serve
```

`http://localhost:4200` adresinden açılır. İlk açılışta demo veri (gönderiler, kuryeler, bölgeler, adresler) otomatik olarak `localStorage`'a yazılır.

## Test

```bash
ng test --watch=false --browsers=ChromeHeadless
```

Kritik iş kuralları (`ShipmentService`) ve validator'lar (`telefonValidator`, `pozitifSayiValidator`) için unit testler `*.spec.ts` dosyalarında bulunur.

## Demo Kullanıcılar (Roller)

Backend/login akışı olmadığı için üst bardaki **Aktif Rol** seçicisiyle rol değiştirilir:

| Rol | Yetki |
|---|---|
| Operasyon Uzmanı | Tüm ekranlara tam erişim: onay, atama, durum değişikliği, rapor |
| Kurye Sorumlusu | Operasyon Uzmanı ile aynı işlem yetkisine sahip |
| Müşteri Hizmetleri | Yalnızca görüntüleme; oluşturma/düzenleme/durum değişikliği ekranları gizlenir |

## Mimari

Feature-based klasör yapısı:

```
src/app/
├── core/
│   ├── services/   # storage, audit, notification, current-user, mock-api
│   ├── guards/     # role guard, unsaved-changes (canDeactivate) guard
│   └── models/     # BaseModel, Rol, AuditLogEntry
├── shared/
│   ├── components/ # empty-state, confirm-dialog, toast
│   ├── pipes/      # statusLabel, tarih
│   ├── directives/ # appStatusBadge, appYetki (rol bazlı), appDebounce
│   └── validators/ # telefon, pozitif sayı
└── features/cargo-operations/
    ├── pages/      # dashboard, gonderiler (list/form/detail), kurye-atama,
    │                 teslimatlar, iadeler, bolgeler, raporlar, audit-log
    ├── services/   # shipment (facade + workflow), courier, zone,
    │                 status-history, delivery-proof, return-request
    └── models/     # Shipment, Courier, DeliveryZone, Assignment, ReturnRequest, ...
```

Veri erişimi component içinde yazılmaz; tüm CRUD ve iş kuralları `features/cargo-operations/services/*` katmanında toplanır. `localStorage`'a tek erişim noktası `core/services/storage.service.ts`'dir.

## İş Kuralları (Workflow)

Gönderi durumları `ShipmentService` içinde tanımlı bir state machine ile yönetilir (`SHIPMENT_STATUS_TRANSITIONS`):

```
olusturuldu → kurye-atandi → dagitimda → teslim-edildi
                    ↓              ↓  ↘
              iptal-edildi   teslim-edilemedi → iade-talebi → iade-edildi
                                    ↓                 
                              dagitimda (tekrar)
```

- Tanımsız durum geçişleri (ör. `olusturuldu → teslim-edildi`) reddedilir.
- Kurye ataması, kurye bölgesi ile gönderi bölgesi eşleşmiyorsa veya kurye günlük kapasitesini aşıyorsa reddedilir.
- `teslim-edildi` durumuna geçiş, önceden bir teslimat kanıtı (`DeliveryProof`) kaydı yoksa engellenir.
- İptal edilen gönderi tekrar aktifleştirilemez.
- Her kritik işlem (oluşturma, atama, durum değişikliği, teslimat kanıtı, iade, iptal) `AuditLogEntry` olarak `audit-log` sayfasında görünür.
- Durum değiştiren tüm işlemler confirm dialog + zorunlu açıklama alanı ister.

## Bilinen Eksikler

- Demo video ve gerçek imza/fotoğraf yükleme (dosya input yerine metin alanı ile simüle edildi) teslim paketine ayrıca eklenmelidir.
- E2E test kapsamı yoktur; yalnızca unit testler mevcuttur.
