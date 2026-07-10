# Demo Video Kayıt Senaryosu

Teslim standardı gereği ("ana ekranlar, CRUD, workflow, hata senaryosu, dashboard ve audit log gösterilecektir") aşağıdaki akışı sırayla ekran kaydına alın (~4-6 dk yeterli).

1. **Dashboard** — KPI kartları ve durum dağılımı grafiğini gösterin.
2. **Gönderi CRUD** — Gönderiler listesi → "+ Yeni Gönderi" → adres seçip formu doldurup kaydedin → detay sayfasına yönlendiğini gösterin → "Düzenle" ile bir alanı değiştirip kaydedin.
3. **Hata senaryosu** — Formda telefonu yanlış biçimde girip (örn. `05321112233`) validasyon hatasının çıktığını gösterin.
4. **Kurye Atama + iş kuralı** — Kurye Atama sayfasında farklı bölgedeki bir kuryeyi seçmeye çalışıp "bölge eşleşmiyor" hatasını, ardından doğru bölgeden kurye atamayı gösterin.
5. **Workflow** — Gönderi detayında durumu "Dağıtımda" yapın, sonra doğrudan "Teslim Edildi" denemeden önce teslimat kanıtı eklemeden geçişin engellendiğini gösterin, kanıtı ekleyip durumu tamamlayın.
6. **İade akışı** — Bir gönderide iade talebi açın, İadeler sayfasında onaylayıp tamamlayın.
7. **Audit Log** — Yapılan tüm işlemlerin audit log'da göründüğünü gösterin.
8. **Rol değişimi** — Sağ üstten "Müşteri Hizmetleri" rolüne geçip düzenleme/atama butonlarının kaybolduğunu gösterin.
9. **Dashboard/Raporlar** — Son haliyle raporlar sayfasında bölge/kurye performans tablolarını gösterin.

Kayıt için macOS'ta `Cmd+Shift+5` ile ekran kaydı başlatabilirsiniz; `ng serve` çalışırken `http://localhost:4200` üzerinden gezin.
