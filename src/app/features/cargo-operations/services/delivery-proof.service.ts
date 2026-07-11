import { Injectable, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { mockRequest } from '../../../core/services/mock-api';
import { DeliveryProof } from '../models/assignment.model';
import { demoDeliveryProofs } from './demo-data';

const PROOFS_KEY = 'staj2_delivery_proofs';

@Injectable({ providedIn: 'root' })
export class DeliveryProofService {
  private readonly proofs = signal<DeliveryProof[]>(
    this.storage.read<DeliveryProof[]>(PROOFS_KEY, demoDeliveryProofs())
  );

  constructor(private storage: StorageService) {}

  gonderiKaniti(shipmentId: string): DeliveryProof | undefined {
    return this.proofs().find((p) => p.shipmentId === shipmentId);
  }

  async olustur(veri: Omit<DeliveryProof, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryProof> {
    return mockRequest(() => {
      const now = new Date().toISOString();
      const yeni: DeliveryProof = { ...veri, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      const updated = [...this.proofs(), yeni];
      this.proofs.set(updated);
      this.storage.write(PROOFS_KEY, updated);
      return yeni;
    });
  }
}
