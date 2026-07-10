import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { Assignment } from '../models/assignment.model';
import { demoAssignments } from './demo-data';

const ASSIGNMENTS_KEY = 'staj2_assignments';

/**
 * Kurye atamalarının kalıcı kaydını tutar. Gönderiye kurye atandığında
 * bir Assignment üretilir; atama iptal edildiğinde/gönderi iptal olduğunda
 * pasife alınır. Böylece "kim, hangi gönderiye, ne zaman atandı" geçmişi
 * gönderi durumundan bağımsız olarak izlenebilir.
 */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly assignments = signal<Assignment[]>(
    this.storage.read<Assignment[]>(ASSIGNMENTS_KEY, demoAssignments())
  );

  readonly liste = computed(() => this.assignments());
  readonly aktifAtamalar = computed(() => this.assignments().filter((a) => a.aktifMi));

  constructor(private storage: StorageService) {}

  private persist(list: Assignment[]): void {
    this.assignments.set(list);
    this.storage.write(ASSIGNMENTS_KEY, list);
  }

  aktifAtama(shipmentId: string): Assignment | undefined {
    return this.assignments().find((a) => a.shipmentId === shipmentId && a.aktifMi);
  }

  /**
   * Atama, gönderi durum güncellemesiyle aynı iş biriminin parçası
   * olduğundan senkron çalışır (audit/status-history kayıtları gibi).
   */
  olustur(shipmentId: string, kuryeId: string): Assignment {
    const now = new Date().toISOString();
    // Aynı gönderi için varsa eski aktif atamayı pasife al.
    const list = this.assignments().map((a) =>
      a.shipmentId === shipmentId && a.aktifMi ? { ...a, aktifMi: false, updatedAt: now } : a
    );
    const yeni: Assignment = {
      id: crypto.randomUUID(),
      shipmentId,
      kuryeId,
      atamaTarihi: now,
      aktifMi: true,
      createdAt: now,
      updatedAt: now,
    };
    this.persist([...list, yeni]);
    return yeni;
  }

  iptalEt(shipmentId: string, neden: string): void {
    const now = new Date().toISOString();
    const list = this.assignments().map((a) =>
      a.shipmentId === shipmentId && a.aktifMi
        ? { ...a, aktifMi: false, iptalNedeni: neden, updatedAt: now }
        : a
    );
    this.persist(list);
  }
}
