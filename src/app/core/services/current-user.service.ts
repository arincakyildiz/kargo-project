import { Injectable, computed, signal } from '@angular/core';
import { Rol } from '../models/base-model';
import { StorageService } from './storage.service';

const CURRENT_ROLE_KEY = 'staj2_current_role';

export interface DemoUser {
  rol: Rol;
  adSoyad: string;
}

const DEMO_USERS: Record<Rol, DemoUser> = {
  'operasyon-uzmani': { rol: 'operasyon-uzmani', adSoyad: 'Elif Operasyon' },
  'kurye-sorumlusu': { rol: 'kurye-sorumlusu', adSoyad: 'Kerem Kurye' },
  'musteri-hizmetleri': { rol: 'musteri-hizmetleri', adSoyad: 'Aylin Destek' },
};

/**
 * Backend/login akışı olmadığı için aktif rolü simüle eden servis.
 * Ekranın sağ üstündeki rol seçiciyle değiştirilir, guard ve
 * directive'ler bu sinyali okur.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly _rol = signal<Rol>(
    this.storage.read<Rol>(CURRENT_ROLE_KEY, 'operasyon-uzmani')
  );

  readonly rol = this._rol.asReadonly();
  readonly kullanici = computed<DemoUser>(() => DEMO_USERS[this._rol()]);

  constructor(private storage: StorageService) {}

  rolDegistir(rol: Rol): void {
    this._rol.set(rol);
    this.storage.write(CURRENT_ROLE_KEY, rol);
  }

  yetkiVarMi(izinliRoller: Rol[]): boolean {
    return izinliRoller.includes(this._rol());
  }
}
