import { APP_INITIALIZER, Provider } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * Demo veri şeması değiştiğinde bu sürüm artırılır; eski sürümle yazılmış
 * localStorage kayıtları temizlenir ve servisler güncel demo veriyle
 * yeniden seed edilir. Kullanıcının rol tercihi korunur.
 */
const SEED_VERSION = 2;
const SEED_VERSION_KEY = 'staj2_seed_version';

const DEMO_KEYS = [
  'staj2_shipments',
  'staj2_couriers',
  'staj2_zones',
  'staj2_addresses',
  'staj2_status_history',
  'staj2_delivery_proofs',
  'staj2_return_requests',
  'staj2_assignments',
  'staj2_audit_log',
];

function seedKontrol(storage: StorageService): () => void {
  return () => {
    const mevcut = storage.read<number>(SEED_VERSION_KEY, 0);
    if (mevcut < SEED_VERSION) {
      for (const key of DEMO_KEYS) {
        storage.remove(key);
      }
      storage.write(SEED_VERSION_KEY, SEED_VERSION);
    }
  };
}

export const DEMO_SEED_PROVIDER: Provider = {
  provide: APP_INITIALIZER,
  useFactory: seedKontrol,
  deps: [StorageService],
  multi: true,
};
