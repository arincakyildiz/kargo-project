import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tarih', standalone: true })
export class TarihPipe implements PipeTransform {
  transform(value: string | Date | undefined, gosterSaat = true): string {
    if (!value) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '—';
    const tarih = d.toLocaleDateString('tr-TR');
    if (!gosterSaat) return tarih;
    const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `${tarih} ${saat}`;
  }
}
