import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { AuditService } from '../../../core/services/audit.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { mockRequest, MockApiError } from '../../../core/services/mock-api';
import { Shipment, ShipmentStatus, SHIPMENT_STATUS_TRANSITIONS } from '../models/shipment.model';
import { DeliveryProof } from '../models/assignment.model';
import { demoShipments } from './demo-data';
import { CourierService } from './courier.service';
import { ZoneService } from './zone.service';
import { StatusHistoryService } from './status-history.service';
import { DeliveryProofService } from './delivery-proof.service';
import { ReturnRequestService } from './return-request.service';

const SHIPMENTS_KEY = 'staj2_shipments';

export class BusinessRuleError extends Error {}

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly shipments = signal<Shipment[]>(
    this.storage.read<Shipment[]>(SHIPMENTS_KEY, demoShipments())
  );

  readonly liste = computed(() => this.shipments());

  constructor(
    private storage: StorageService,
    private audit: AuditService,
    private currentUser: CurrentUserService,
    private courierService: CourierService,
    private zoneService: ZoneService,
    private statusHistory: StatusHistoryService,
    private deliveryProofService: DeliveryProofService,
    private returnRequestService: ReturnRequestService
  ) {}

  private persist(list: Shipment[]): void {
    this.shipments.set(list);
    this.storage.write(SHIPMENTS_KEY, list);
  }

  async tumunuGetir(errorRate = 0): Promise<Shipment[]> {
    return mockRequest(() => this.liste(), { ms: 350, errorRate });
  }

  async birGetir(id: string): Promise<Shipment | undefined> {
    return mockRequest(() => this.shipments().find((s) => s.id === id), { ms: 250 });
  }

  async olustur(veri: {
    aliciAdSoyad: string;
    aliciTelefon: string;
    adresId: string;
    bolgeId: string;
    agirlikKg: number;
    aciklama?: string;
  }): Promise<Shipment> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      const takipKodu = `TK-${Math.floor(100000 + Math.random() * 899999)}`;
      const yeni: Shipment = {
        ...veri,
        id: crypto.randomUUID(),
        takipKodu,
        status: 'olusturuldu',
        createdAt: now,
        updatedAt: now,
      };
      this.persist([...this.shipments(), yeni]);
      this.statusHistory.ekle({
        shipmentId: yeni.id,
        eskiStatus: null,
        yeniStatus: 'olusturuldu',
        aciklama: 'Gönderi kaydı oluşturuldu.',
        islemYapanRol: this.currentUser.rol(),
      });
      this.audit.kaydet({
        islemTipi: 'gonderi-olustur',
        rol: this.currentUser.rol(),
        aciklama: `Gönderi oluşturuldu: ${takipKodu}`,
        hedefId: yeni.id,
        yeniDeger: 'olusturuldu',
      });
      return yeni;
    });
  }

  async guncelle(
    id: string,
    veri: Partial<Pick<Shipment, 'aliciAdSoyad' | 'aliciTelefon' | 'adresId' | 'bolgeId' | 'agirlikKg' | 'aciklama'>>
  ): Promise<Shipment> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      let guncellenen: Shipment | undefined;
      const list = this.shipments().map((s) => {
        if (s.id !== id) return s;
        guncellenen = { ...s, ...veri, updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new MockApiError('Gönderi bulunamadı.');
      this.persist(list);
      this.audit.kaydet({
        islemTipi: 'gonderi-guncelle',
        rol: this.currentUser.rol(),
        aciklama: `Gönderi bilgileri güncellendi: ${guncellenen.takipKodu}`,
        hedefId: id,
      });
      return guncellenen;
    });
  }

  async iptalEt(id: string, neden: string): Promise<Shipment> {
    return this.durumDegistir(id, 'iptal-edildi', neden);
  }

  /**
   * Kurye atama: bölge eşleşmesi ve günlük kapasite kontrolü yapılır,
   * ardından durum 'kurye-atandi' olarak günceller.
   */
  async kuryeAta(shipmentId: string, kuryeId: string): Promise<Shipment> {
    const shipment = this.shipments().find((s) => s.id === shipmentId);
    if (!shipment) throw new BusinessRuleError('Gönderi bulunamadı.');

    const kurye = this.courierService.kuryeGetir(kuryeId);
    if (!kurye) throw new BusinessRuleError('Kurye bulunamadı.');
    if (!kurye.aktifMi) throw new BusinessRuleError('Seçilen kurye aktif değil.');

    if (kurye.bolgeId !== shipment.bolgeId) {
      throw new BusinessRuleError('Kuryenin bölgesi, gönderinin teslimat bölgesiyle eşleşmiyor.');
    }

    const bugunAtanan = this.shipments().filter(
      (s) => s.kuryeId === kuryeId && ['kurye-atandi', 'dagitimda'].includes(s.status)
    ).length;
    if (bugunAtanan >= kurye.gunlukKapasite) {
      throw new BusinessRuleError(`${kurye.adSoyad} günlük kapasitesinin (${kurye.gunlukKapasite}) üzerinde gönderi alamaz.`);
    }

    return mockRequest(() => {
      const now = new Date().toISOString();
      const eskiStatus = shipment.status;
      let guncellenen: Shipment | undefined;
      const list = this.shipments().map((s) => {
        if (s.id !== shipmentId) return s;
        guncellenen = { ...s, kuryeId, status: 'kurye-atandi', updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new MockApiError('Gönderi bulunamadı.');

      this.gecisiDogrula(eskiStatus, 'kurye-atandi');
      this.persist(list);
      this.statusHistory.ekle({
        shipmentId,
        eskiStatus,
        yeniStatus: 'kurye-atandi',
        aciklama: `Kurye atandı: ${kurye.adSoyad}`,
        islemYapanRol: this.currentUser.rol(),
      });
      this.audit.kaydet({
        islemTipi: 'kurye-atama',
        rol: this.currentUser.rol(),
        aciklama: `${guncellenen.takipKodu} gönderisine ${kurye.adSoyad} atandı.`,
        hedefId: shipmentId,
        eskiDeger: eskiStatus,
        yeniDeger: 'kurye-atandi',
      });
      return guncellenen;
    });
  }

  private gecisiDogrula(eski: ShipmentStatus, yeni: ShipmentStatus): void {
    const izinli = SHIPMENT_STATUS_TRANSITIONS[eski] ?? [];
    if (!izinli.includes(yeni)) {
      throw new BusinessRuleError(`"${eski}" durumundan "${yeni}" durumuna geçiş yapılamaz.`);
    }
  }

  /** Genel durum geçişi; workflow kurallarını doğrular ve audit log üretir. */
  async durumDegistir(id: string, yeniStatus: ShipmentStatus, aciklama: string): Promise<Shipment> {
    const shipment = this.shipments().find((s) => s.id === id);
    if (!shipment) throw new BusinessRuleError('Gönderi bulunamadı.');

    this.gecisiDogrula(shipment.status, yeniStatus);

    if (yeniStatus === 'teslim-edildi' && !this.deliveryProofService.gonderiKaniti(id)) {
      throw new BusinessRuleError('Teslim edildi durumuna geçmek için önce teslimat kanıtı eklenmelidir.');
    }

    return mockRequest(() => {
      const now = new Date().toISOString();
      const eskiStatus = shipment.status;
      let guncellenen: Shipment | undefined;
      const list = this.shipments().map((s) => {
        if (s.id !== id) return s;
        guncellenen = { ...s, status: yeniStatus, updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new MockApiError('Gönderi bulunamadı.');
      this.persist(list);
      this.statusHistory.ekle({
        shipmentId: id,
        eskiStatus,
        yeniStatus,
        aciklama,
        islemYapanRol: this.currentUser.rol(),
      });
      this.audit.kaydet({
        islemTipi: 'durum-degisikligi',
        rol: this.currentUser.rol(),
        aciklama: `${guncellenen.takipKodu}: ${eskiStatus} → ${yeniStatus}. ${aciklama}`,
        hedefId: id,
        eskiDeger: eskiStatus,
        yeniDeger: yeniStatus,
      });
      return guncellenen;
    });
  }

  async teslimatKanitiEkle(
    shipmentId: string,
    veri: Omit<DeliveryProof, 'id' | 'createdAt' | 'updatedAt' | 'shipmentId'>
  ): Promise<DeliveryProof> {
    const proof = await this.deliveryProofService.olustur({ ...veri, shipmentId });
    this.audit.kaydet({
      islemTipi: 'teslimat-kaniti',
      rol: this.currentUser.rol(),
      aciklama: `Teslimat kanıtı eklendi: ${veri.teslimAlanAdSoyad}`,
      hedefId: shipmentId,
    });
    return proof;
  }

  async iadeTalebiOlustur(shipmentId: string, neden: string): Promise<void> {
    await this.durumDegistir(shipmentId, 'iade-talebi', neden);
    await this.returnRequestService.olustur({ shipmentId, neden, status: 'beklemede' });
  }
}
