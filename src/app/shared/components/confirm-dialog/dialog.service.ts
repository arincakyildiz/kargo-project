import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  baslik: string;
  mesaj: string;
  aciklamaGerekli?: boolean;
  onayMetni?: string;
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (sonuc: { onaylandi: boolean; aciklama?: string }) => void;
}

/** Kritik işlemler (silme/iptal/durum değişikliği) için confirm dialog. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly pending = signal<PendingConfirm | null>(null);

  confirm(request: ConfirmRequest): Promise<{ onaylandi: boolean; aciklama?: string }> {
    return new Promise((resolve) => {
      this.pending.set({ ...request, resolve });
    });
  }

  cozumle(onaylandi: boolean, aciklama?: string): void {
    const istek = this.pending();
    if (!istek) return;
    this.pending.set(null);
    istek.resolve({ onaylandi, aciklama });
  }
}
