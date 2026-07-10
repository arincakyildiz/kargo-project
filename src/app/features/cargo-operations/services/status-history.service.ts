import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { StatusHistoryEntry } from '../models/shipment.model';
import { demoStatusHistory } from './demo-data';

const HISTORY_KEY = 'staj2_status_history';

@Injectable({ providedIn: 'root' })
export class StatusHistoryService {
  private readonly entries = signal<StatusHistoryEntry[]>(
    this.storage.read<StatusHistoryEntry[]>(HISTORY_KEY, demoStatusHistory())
  );

  constructor(private storage: StorageService) {}

  gonderiGecmisi(shipmentId: string) {
    return computed(() =>
      this.entries()
        .filter((e) => e.shipmentId === shipmentId)
        .sort((a, b) => a.islemZamani.localeCompare(b.islemZamani))
    );
  }

  ekle(entry: Omit<StatusHistoryEntry, 'id' | 'islemZamani'>): void {
    const yeni: StatusHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      islemZamani: new Date().toISOString(),
    };
    const updated = [...this.entries(), yeni];
    this.entries.set(updated);
    this.storage.write(HISTORY_KEY, updated);
  }
}
