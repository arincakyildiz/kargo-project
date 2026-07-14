import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { mockRequest } from '../../../core/services/mock-api';
import { ReturnRequest } from '../models/assignment.model';
import { demoReturnRequests } from './demo-data';

const RETURNS_KEY = 'staj2_return_requests';

@Injectable({ providedIn: 'root' })
export class ReturnRequestService {
  private readonly returns = signal<ReturnRequest[]>(
    this.storage.read<ReturnRequest[]>(RETURNS_KEY, [])
  );

  readonly liste = computed(() => this.returns());

  constructor(private storage: StorageService) {}

  gonderiIadesi(shipmentId: string): ReturnRequest | undefined {
    return this.returns().find((r) => r.shipmentId === shipmentId);
  }

  private persist(list: ReturnRequest[]): void {
    this.returns.set(list);
    this.storage.write(RETURNS_KEY, list);
  }

  ornekVeriYukle(): void {
    this.persist(demoReturnRequests());
  }

  verileriSil(): void {
    this.persist([]);
  }

  async olustur(veri: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReturnRequest> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      const yeni: ReturnRequest = { ...veri, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      this.persist([...this.returns(), yeni]);
      return yeni;
    });
  }

  async durumGuncelle(id: string, status: ReturnRequest['status']): Promise<ReturnRequest> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      let guncellenen: ReturnRequest | undefined;
      const list = this.returns().map((r) => {
        if (r.id !== id) return r;
        guncellenen = { ...r, status, updatedAt: now };
        return guncellenen;
      });
      if (!guncellenen) throw new Error('İade talebi bulunamadı.');
      this.persist(list);
      return guncellenen;
    });
  }
}
