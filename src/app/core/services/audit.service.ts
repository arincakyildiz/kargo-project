import { Injectable, computed, signal } from '@angular/core';
import { AuditLogEntry, Rol } from '../models/base-model';
import { StorageService } from './storage.service';

const AUDIT_KEY = 'staj2_audit_log';
const OKUNAN_BILDIRIM_KEY = 'staj2_okunan_bildirimler';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly entries = signal<AuditLogEntry[]>(
    this.storage.read<AuditLogEntry[]>(AUDIT_KEY, [])
  );
  private readonly okunanBildirimIdler = signal<Set<string>>(
    new Set(this.storage.read<string[]>(OKUNAN_BILDIRIM_KEY, []))
  );

  readonly log = computed(() =>
    [...this.entries()].sort((a, b) => b.islemZamani.localeCompare(a.islemZamani))
  );

  /** Bildirim çanında henüz görüntülenmemiş işlemler; görüntülenince listeden düşer. */
  readonly okunmamisBildirimler = computed(() => {
    const okunan = this.okunanBildirimIdler();
    return this.log().filter((e) => !okunan.has(e.id));
  });

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

  bildirimleriOkunduIsaretle(idler: string[]): void {
    if (!idler.length) return;
    const guncel = new Set(this.okunanBildirimIdler());
    idler.forEach((id) => guncel.add(id));
    this.okunanBildirimIdler.set(guncel);
    this.storage.write(OKUNAN_BILDIRIM_KEY, [...guncel]);
  }

  temizle(): void {
    this.entries.set([]);
    this.storage.write(AUDIT_KEY, []);
    this.okunanBildirimIdler.set(new Set());
    this.storage.write(OKUNAN_BILDIRIM_KEY, []);
  }
}
