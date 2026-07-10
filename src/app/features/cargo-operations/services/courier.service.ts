import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { mockRequest } from '../../../core/services/mock-api';
import { Courier } from '../models/courier.model';
import { demoCouriers } from './demo-data';

const COURIERS_KEY = 'staj2_couriers';

@Injectable({ providedIn: 'root' })
export class CourierService {
  private readonly couriers = signal<Courier[]>(
    this.storage.read<Courier[]>(COURIERS_KEY, demoCouriers())
  );

  readonly liste = computed(() => this.couriers());
  readonly aktifKuryeler = computed(() => this.couriers().filter((k) => k.aktifMi));

  constructor(private storage: StorageService) {}

  async tumunuGetir(): Promise<Courier[]> {
    return mockRequest(() => this.couriers(), { ms: 250 });
  }

  kuryeAdi(kuryeId?: string): string {
    if (!kuryeId) return 'Atanmadı';
    return this.couriers().find((k) => k.id === kuryeId)?.adSoyad ?? '—';
  }

  kuryeGetir(kuryeId: string): Courier | undefined {
    return this.couriers().find((k) => k.id === kuryeId);
  }

  private persist(list: Courier[]): void {
    this.couriers.set(list);
    this.storage.write(COURIERS_KEY, list);
  }

  async olustur(veri: Omit<Courier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Courier> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      const yeni: Courier = { ...veri, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      this.persist([...this.couriers(), yeni]);
      return yeni;
    });
  }

  async guncelle(id: string, veri: Partial<Omit<Courier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Courier> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      let guncellenen: Courier | undefined;
      const list = this.couriers().map((k) => {
        if (k.id !== id) return k;
        guncellenen = { ...k, ...veri, updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new Error('Kurye bulunamadı.');
      this.persist(list);
      return guncellenen;
    });
  }
}
