import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" *ngIf="dialog.pending() as istek">
      <div class="dialog">
        <h3>{{ istek.baslik }}</h3>
        <p>{{ istek.mesaj }}</p>
        <div class="dialog__aciklama" *ngIf="istek.aciklamaGerekli">
          <label for="aciklama">Açıklama <span class="zorunlu">*</span></label>
          <textarea
            id="aciklama"
            rows="3"
            maxlength="100"
            placeholder="Bu işlem için açıklama girin"
            [(ngModel)]="aciklama"
          ></textarea>
          <small class="char-counter">{{ aciklama.length }} / 100</small>
        </div>
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" (click)="iptal()">Vazgeç</button>
          <button
            type="button"
            class="btn btn--primary"
            [disabled]="istek.aciklamaGerekli && !aciklama.trim()"
            (click)="onayla()"
          >
            {{ istek.onayMetni ?? 'Onayla' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: var(--color-card); border-radius: 12px; padding: 1.5rem; width: min(420px, 90vw); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .dialog h3 { margin: 0 0 0.5rem; color: var(--color-primary-dark); }
    .dialog p { margin: 0 0 1rem; color: var(--color-text); }
    .dialog__aciklama { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
    .dialog__aciklama textarea { resize: vertical; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 8px; font: inherit; }
    .char-counter { align-self: flex-end; color: var(--color-muted); font-size: 0.75rem; }
    .zorunlu { color: var(--color-danger); }
    .dialog__actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid transparent; cursor: pointer; font-weight: 600; }
    .btn--ghost { background: transparent; border-color: var(--color-border); color: var(--color-text); }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn--primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ConfirmDialogComponent {
  aciklama = '';

  constructor(public dialog: DialogService) {}

  onayla(): void {
    this.dialog.cozumle(true, this.aciklama);
    this.aciklama = '';
  }

  iptal(): void {
    this.dialog.cozumle(false);
    this.aciklama = '';
  }
}
