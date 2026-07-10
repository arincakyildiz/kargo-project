import { Injectable, computed, signal } from '@angular/core';
import { AuditLogEntry, Rol } from '../models/base-model';
import { StorageService } from './storage.service';

const AUDIT_KEY = 'staj2_audit_log';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly entries = signal<AuditLogEntry[]>(
    this.storage.read<AuditLogEntry[]>(AUDIT_KEY, [])
  );

  readonly log = computed(() =>
    [...this.entries()].sort((a, b) => b.islemZamani.localeCompare(a.islemZamani))
  );

  constructor(private storage: StorageService) {}

  kaydet(entry: Omit<AuditLogEntry, 'id' | 'islemZamani'>): void {
    const yeni: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      islemZamani: new Date().toISOString(),
    };
    const updated = [...this.entries(), yeni];
    this.entries.set(updated);
    this.storage.write(AUDIT_KEY, updated);
  }
}
