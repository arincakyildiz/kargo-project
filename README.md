# 📦 Kargo Operasyon, Kurye Atama ve Teslimat Takip Paneli

> **Staj Değerlendirme Projesi — İleri Seviye**  
> Angular 17+ · Standalone Components · Signals · Reactive Forms · Mock API · localStorage

---

## 📋 İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Test](#test)
- [Kullanıcı Rolleri](#kullanıcı-rolleri)
- [Özellikler](#özellikler)
- [İş Kuralları ve Durum Workflow](#iş-kuralları-ve-durum-workflow)
- [Mimari](#mimari)
- [Veri Yaklaşımı](#veri-yaklaşımı)
- [Güvenlik ve Yetkilendirme](#güvenlik-ve-yetkilendirme)
- [UX / Form Davranışları](#ux--form-davranışları)
- [Bilinen Eksikler](#bilinen-eksikler)

---

## Proje Hakkında

Bu proje, bir kargo şirketinin operasyonel süreçlerini yöneten ileri seviye bir **Angular SPA**'dır. Backend yoktur; tüm veri tarayıcının `localStorage`'ında kalıcı olarak tutulur. Servis katmanı, gerçek bir REST API'yi simüle eden gecikme ve hata olasılıklı `mockRequest()` fonksiyonu üzerinden çalışır.

### Kapsanan İş Süreçleri

| Süreç | Açıklama |
|---|---|
| Gönderi Yönetimi | Oluşturma, listeleme, düzenleme, iptal, durum takibi |
| Kurye Atama | Kurye CRUD, bölge bazlı atama, kapasite kontrolü |
| Durum Workflow | Rol/yetki tabanlı durum geçişleri, audit log |
| Teslimat Kanıtı | Kanıt kaydı olmadan teslim edildi durumu engellidir |
| İade Yönetimi | İade talebi oluşturma, durum takibi |
| Raporlama | KPI'lar, durum dağılımı, kurye performansı |
| Bölge Yönetimi | 81 il / gerçek ilçe verisiyle bölge tanımlama |
| Denetim Kaydı | Her kritik işlem audit log'a düşer |

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Angular 17+ |
| Component Mimarisi | Standalone Components |
| State Yönetimi | Angular Signals (`signal`, `computed`, `effect`) |
| Form Yönetimi | Reactive Forms (`FormBuilder`, `Validators`) |
| Asenkron İşlem | RxJS (`debounceTime` — DebounceDirective) |
| Route Guard | `CanActivate` (role.guard) + `CanDeactivate` (unsaved-changes.guard) |
| Veri Kalıcılığı | `localStorage` — `StorageService` tekil erişim noktası |
| Mock API | `mockRequest()` — gecikme (ms) + hata oranı (errorRate) parametreli |
| Test | Jasmine + Karma + ChromeHeadless |
| Stil | SCSS + CSS custom properties (dark/light tema desteği) |

---

## Kurulum ve Çalıştırma

> **Gereksinim:** Node 22 (Angular build araçları Node 23+ ile çalışmaz)

```bash
# Node sürümünü ayarla
nvm use 22
# veya: export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# Bağımlılıkları kur
npm install

# Geliştirme sunucusunu başlat
ng serve
```

Uygulama `http://localhost:4200` adresinde açılır.

### İlk Başlatma

Sistem **boş** başlar. İki seçenek:
1. **Örnek veri yükle:** Üst bardaki `Veri Yönetimi → Örnek Veri Yükle` — tüm modülleri kapsayan tutarlı bir demo dataset tek tıkla yüklenir.
2. **Manuel giriş:** Önce Bölge, ardından Kurye, ardından Gönderi ekleyerek sistemi sıfırdan doldurabilirsiniz.

### Hata Senaryosu Simülasyonu

`Veri Yönetimi → Hata Ekranını Simüle Et` seçildikten sonra herhangi bir sayfayı yenilediğinizde mock API bilerek hata döndürür. Sayfadaki **"Tekrar Dene"** butonu ile normal akışa dönülür. Bu özellik **error state** tasarımını doğrulamak için kullanılır.

---

## Test

```bash
ng test --watch=false --browsers=ChromeHeadless
```

### Test Kapsamı

| Test Dosyası | Kapsam |
|---|---|
| `shipment.service.spec.ts` | Gönderi oluşturma, durum geçişleri, iş kuralı ihlalleri, audit log |
| `courier.service.spec.ts` | Kurye CRUD, bölge uyumu, kapasite kontrolü |
| `telefon.validator.spec.ts` | Boşluklu/boşluksuz format, geçersiz girişler |

**Son test çıktısı:**
```
TOTAL: 27 SUCCESS
Chrome Headless — Executed 27 of 27 SUCCESS
```

---

## Kullanıcı Rolleri

Backend/login akışı olmadığı için üst bardaki **Aktif Rol** seçicisiyle rol değiştirilir. Rol değişikliği anında tüm UI kısıtlamalarını günceller.

| Rol | Yetki |
|---|---|
| **Operasyon Uzmanı** | Tüm ekranlara tam erişim. Gönderi oluşturma/düzenleme/iptal, kurye atama, durum değiştirme, rapor görüntüleme, bölge/kurye yönetimi. |
| **Kurye Sorumlusu** | Operasyon Uzmanı ile aynı işlem yetkisine sahip. Onay/atama/durum değişikliği ve rapor ekranlarına erişir. |
| **Müşteri Hizmetleri** | Gönderi listesinde tüm kayıtları göremez — yalnızca takip kodu veya alıcı adıyla arama yaparak kendi kaydını bulur. Durum değiştiremez. Gönderi detayında sınırlı işlem olarak müşteri notu ekleyebilir (audit log üretir). |

### Yetki Mekanizması

- `*appYetki` structural directive ile UI elemanları rol bazında DOM'dan kaldırılır (`mode: 'hide'`) veya bulanıklaştırılır (`mode: 'blur'`).
- `RoleGuard` ile rota bazında koruma uygulanır.
- Servis katmanında da iş kuralı ihlallerinde `BusinessRuleError` fırlatılır.

---

## Özellikler

### 1. Gönderi Yönetimi

- **Listeleme:** Arama (takip kodu / alıcı adı / bölge), durum filtresi, sıralama, sayfalama (10/20/50/100)
- **Detay:** Durum timeline'ı (tüm geçiş geçmişi), teslimat kanıtı, atanan kurye bilgisi
- **Oluşturma / Düzenleme:** Reactive form, kayıtlı adres seçimi veya yeni adres ekleme
- **İptal:** Confirm dialog + zorunlu açıklama + audit log
- **Ekran Durumları:** Loading skeleton, empty state, error state + "Tekrar Dene", form validation hataları, toast bildirimleri

### 2. Kurye Atama

- **Kurye CRUD:** Oluştur, düzenle, aktif/pasif et — form dirty uyarısı (kaydedilmemiş değişiklik)
- **Kapasite Göstergesi:** Doluluk oranı renk kodlu: 🟢 <%80 · 🟡 %80-99 · 🔴 ≥%100 ⚠️ Dolu
- **Bölge Bazlı Atama:** Kurye, yalnızca kendi bölgesindeki gönderilere atanabilir
- **Kapasite Aşımı:** Kurye günlük kapasitesini aştığında atama iş kuralı hatası verir
- **Ekran Durumları:** Loading, empty state, error state, form validation

### 3. Durum Workflow

Gönderi durumları `ShipmentService` içindeki state machine ile kontrol edilir:

```
olusturuldu → kurye-atandi → dagitimda → teslim-edildi
                    ↓              ↓  ↘
              iptal-edildi   teslim-edilemedi → iade-talebi → iade-edildi
                                    ↓
                              dagitimda (tekrar deneme)
```

- Tanımsız geçişler (örn. `olusturuldu → teslim-edildi`) reddedilir
- Her geçişte **confirm dialog + zorunlu açıklama alanı** zorunludur
- Her geçiş **audit log**'a düşer

### 4. Teslimat Kanıtı

- Teslimat kanıtı olmadan `teslim-edildi` durumuna geçiş **engellenir**
- Kanıt: imza metni / fotoğraf açıklaması + zaman damgası
- Listeleme, oluşturma, görüntüleme ekranları mevcut

### 5. İade Yönetimi

- İade talebi oluşturma (gönderi ID, alıcı notu)
- Durum takibi: beklemede → onaylandı / reddedildi
- Her işlemde audit log

### 6. Raporlama

- **Dashboard KPI'ları:** Toplam gönderi, bugünkü teslimat, bekleyen atama, aktif kurye sayısı
- **Tarih Aralığı Filtresi:** Son 7 gün / Son 30 gün / Tümü
- **Durum Dağılımı:** Bar chart (SVG)
- **Kurye Performans Sayfası:** Teslimat oranı, ortalama teslim süresi, gecikme oranı
- **Bölge Bazlı Yoğunluk:** Hangi bölgede kaç gönderi var

### 7. Bölge Yönetimi

- **Gerçek il/ilçe verisi:** Türkiye'nin 81 ili ve tüm ilçeleri dropdown olarak sunulur — serbest metin girilemez
- Bölge pasife alınmadan önce o bölgedeki **aktif gönderi sayısı** uyarıda gösterilir
- Listeleme, oluşturma, düzenleme, aktif/pasif etme

### 8. Denetim Kaydı (Audit Log)

- Tüm kritik işlemler otomatik kaydedilir: gönderi oluşturma, durum geçişi, atama, teslimat kanıtı, iade, iptal, bölge değişikliği
- Her kayıtta: zaman damgası, işlem tipi, işlemi yapan rol, açıklama, hedef ID
- Filtreleme ve listeleme ekranı

---

## İş Kuralları ve Durum Workflow

| Kural | Açıklama |
|---|---|
| Bölge uyumu | Kurye, gönderi bölgesiyle aynı bölgede değilse atama reddedilir |
| Kapasite kontrolü | Kurye günlük kapasitesini aştığında atama engellenir (`BusinessRuleError`) |
| Teslimat kanıtı zorunluluğu | `teslim-edildi` geçişi öncesinde `DeliveryProof` kaydı yoksa engellenir |
| İptal sonrası değişmezlik | İptal edilen gönderi tekrar aktifleştirilemez |
| Yetki zorunluluğu | `musteri-hizmetleri` rolü durum değiştiremez; sadece okur |
| Audit log zorunluluğu | Tüm durum geçişleri + kritik CRUD işlemleri audit log üretir |
| Açıklama zorunluluğu | Durum geçişi diyalogunda açıklama alanı boş bırakılamaz |
| Kurye kapasite max | Günlük kapasite 1-200 arası; 200 üstü anlık sıfırlanır |
| Ağırlık max | Gönderi ağırlığı 0.1-500 kg; 500 üstü anlık sıfırlanır |

---

## Mimari

```
src/app/
├── core/
│   ├── services/
│   │   ├── storage.service.ts        # localStorage tek erişim noktası
│   │   ├── mock-api.ts               # mockRequest() — gecikme + hata simülasyonu
│   │   ├── audit.service.ts          # Audit log kayıt servisi
│   │   ├── notification.service.ts   # Toast bildirimleri
│   │   └── current-user.service.ts  # Aktif rol yönetimi
│   ├── guards/
│   │   ├── role.guard.ts             # CanActivate — rota erişim kontrolü
│   │   └── unsaved-changes.guard.ts # CanDeactivate — kaydedilmemiş form uyarısı
│   └── models/
│       └── base-model.ts             # BaseModel, Rol tipi
│
├── shared/
│   ├── components/
│   │   ├── confirm-dialog/           # Onay diyaloğu (açıklama alanı dahil)
│   │   ├── empty-state/              # Boş liste durumu
│   │   └── toast/                    # Bildirim toastları
│   ├── directives/
│   │   ├── yetki.directive.ts        # *appYetki — rol bazlı DOM kontrolü
│   │   ├── debounce.directive.ts     # Arama inputları için debounce
│   │   ├── telefon-mask.directive.ts # Otomatik telefon formatı (05XX XXX XX XX)
│   │   ├── no-wheel.directive.ts     # Scroll ile sayı değişimini engeller
│   │   └── status-badge.directive.ts # Durum rozeti renklendirme
│   ├── pipes/
│   │   ├── status-label.pipe.ts      # Durum kodu → Türkçe etiket
│   │   └── tarih.pipe.ts             # Tarih biçimlendirme
│   └── validators/
│       └── telefon.validator.ts      # telefonValidator + pozitifSayiValidator
│
└── features/cargo-operations/
    ├── data/
    │   └── turkiye-iller.ts          # 81 il + tüm gerçek ilçe verisi
    ├── models/                        # Shipment, Courier, DeliveryZone, Assignment,
    │                                  # CourierCapacity, ReturnRequest, DeliveryProof,
    │                                  # StatusHistory, CustomerAddress, OperationMetric
    ├── services/
    │   ├── shipment.service.ts       # Gönderi CRUD + durum state machine
    │   ├── courier.service.ts        # Kurye CRUD
    │   ├── zone.service.ts           # Bölge CRUD + müşteri adresleri
    │   ├── assignment.service.ts     # Kurye atama kayıtları
    │   ├── status-history.service.ts # Durum geçiş geçmişi
    │   ├── delivery-proof.service.ts # Teslimat kanıtı
    │   └── return-request.service.ts # İade talepleri
    └── pages/
        ├── dashboard/                # KPI, grafik, tarih filtresi
        ├── shipment-list/            # Gönderi listesi
        ├── shipment-form/            # Gönderi oluştur / düzenle
        ├── shipment-detail/          # Detay + timeline
        ├── courier-assignment/       # Kurye yönetimi + atama
        ├── deliveries/               # Teslimat kanıtları
        ├── returns/                  # İade yönetimi
        ├── zones/                    # Bölge yönetimi
        ├── reports/                  # Kurye performans raporları
        └── audit-log/                # Denetim kaydı
```

---

## Veri Yaklaşımı

- Veri erişimi **hiçbir zaman component içinde yazılmaz.** Tüm CRUD ve iş kuralları `features/cargo-operations/services/*` katmanında toplanır.
- `localStorage`'a tek erişim noktası `core/services/storage.service.ts`'dir; başka hiçbir yer doğrudan `localStorage` kullanmaz.
- Her servis metodu `mockRequest()` ile sarılır: gerçek bir API'yi simüle eden **gecikme** (ms) ve **hata olasılığı** (errorRate) parametreleri alır.
- Takip kodu formatı: `KRG-YYYYMMDD-XXXX` (tarih + rastgele 4 hane)

---

## Güvenlik ve Yetkilendirme

- **Rota koruması:** `RoleGuard` — kullanıcı rolü yetersizse ilgili rota erişimi reddedilir
- **UI koruması:** `*appYetki` directive — DOM'dan elemanlar kaldırılır veya bulanıklaştırılır
- **Servis koruması:** İş kuralı ihlallerinde `BusinessRuleError` fırlatılır; bileşen katmanına anlamlı hata mesajı ulaşır
- **Kaydedilmemiş form uyarısı:** `UnsavedChangesGuard` (shipment-form) + dialog confirm (kurye formu) — form dirty iken sayfadan çıkışta uyarı gösterilir

---

## UX / Form Davranışları

| Özellik | Detay |
|---|---|
| Telefon mask | Yazarken otomatik `05XX XXX XX XX` formatına geçer |
| Telefon validator | Boşluklu veya boşluksuz 11 hane kabul edilir |
| Kapasite clamp | 200'ün üstü yazıldığında anlık 200'e sıfırlanır |
| Ağırlık clamp | 500 kg'ın üstü yazıldığında anlık 500'e sıfırlanır |
| Scroll koruması | Sayı inputlarında mouse scroll ile değer değişmez |
| İl / İlçe seçimi | Türkiye'nin 81 ili — il seçildikten sonra o ilin gerçek ilçeleri listelenir |
| Kapasite uyarısı | Doluluk ≥%80 sarı, ≥%100 kırmızı + ⚠️ Dolu etiketi |
| Bölge pasif uyarısı | Pasife alınacak bölgede aktif gönderi varsa sayı diyalogda gösterilir |
| Form kirli uyarısı | Kurye formunda değişiklik varken Vazgeç'e basınca onay istenir |
| Karakter sayacı | Açıklama textarea'sında canlı karakter sayacı (ör. 43 / 100) |
| Debounce | Arama inputlarında 350ms debounce — gereksiz filtre tetiklenmez |
| Sayfalama | Filtre/arama/sıralama değişiminde sayfa 1'e otomatik sıfırlanır |
| Tema | Dark / Light mod desteği (sistem tercihi + manuel geçiş) |

---

## Bilinen Eksikler

| Eksik | Açıklama |
|---|---|
| Demo video | Uygulamanın temel akışlarını gösteren ekran kaydı teslim paketine ayrıca eklenmelidir |
| Gerçek dosya yükleme | Teslimat kanıtında imza / fotoğraf metin alanıyla simüle edildi; gerçek `<input type="file">` eklenmedi |
| E2E test | Yalnızca unit testler mevcuttur; Cypress / Playwright ile E2E kapsam yoktur |
| Sayfalama (iade/teslimat) | İade ve teslimat listelerinde sayfalama implementasyonu henüz eklenmedi |
