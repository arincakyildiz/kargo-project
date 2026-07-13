import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

const THEME_KEY = 'staj2_theme';

export type Tema = 'light' | 'dark';

/** Karanlık/aydınlık tema tercihi; <html data-theme="..."> üzerinden CSS değişkenlerini değiştirir. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _tema = signal<Tema>(this.storage.read<Tema>(THEME_KEY, 'light'));
  readonly tema = this._tema.asReadonly();

  constructor(private storage: StorageService) {
    this.uygula(this._tema());
  }

  degistir(): void {
    const yeni: Tema = this._tema() === 'light' ? 'dark' : 'light';
    this._tema.set(yeni);
    this.storage.write(THEME_KEY, yeni);
    this.uygula(yeni);
  }

  private uygula(tema: Tema): void {
    document.documentElement.setAttribute('data-theme', tema);
  }
}
