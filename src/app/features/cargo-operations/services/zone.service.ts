import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { mockRequest } from '../../../core/services/mock-api';
import { DeliveryZone, CustomerAddress } from '../models/zone.model';
import { demoAddresses, demoZones } from './demo-data';

const ZONES_KEY = 'staj2_zones';
const ADDRESSES_KEY = 'staj2_addresses';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly zones = signal<DeliveryZone[]>(
    this.storage.read<DeliveryZone[]>(ZONES_KEY, demoZones())
  );
  private readonly addresses = signal<CustomerAddress[]>(
    this.storage.read<CustomerAddress[]>(ADDRESSES_KEY, demoAddresses())
  );

  readonly liste = computed(() => this.zones());
  readonly aktifBolgeler = computed(() => this.zones().filter((z) => z.aktifMi));
  readonly adresListe = computed(() => this.addresses());

  constructor(private storage: StorageService) {}

  async tumunuGetir(): Promise<DeliveryZone[]> {
    return mockRequest(() => this.zones(), { ms: 250 });
  }

  async adresGetir(adresId: string): Promise<CustomerAddress | undefined> {
    return mockRequest(() => this.addresses().find((a) => a.id === adresId), { ms: 150 });
  }

  bolgeAdi(bolgeId: string): string {
    return this.zones().find((z) => z.id === bolgeId)?.ad ?? '—';
  }

  private persistZones(list: DeliveryZone[]): void {
    this.zones.set(list);
    this.storage.write(ZONES_KEY, list);
  }

  async olustur(veri: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryZone> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      const yeni: DeliveryZone = { ...veri, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      this.persistZones([...this.zones(), yeni]);
      return yeni;
    });
  }

  async guncelle(id: string, veri: Partial<Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DeliveryZone> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      let guncellenen: DeliveryZone | undefined;
      const list = this.zones().map((z) => {
        if (z.id !== id) return z;
        guncellenen = { ...z, ...veri, updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new Error('Bölge bulunamadı.');
      this.persistZones(list);
      return guncellenen;
    });
  }
}
