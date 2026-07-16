import { Directive, HostListener, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Telefon numarasını yazarken otomatik olarak "05XX XXX XX XX" biçimine getirir.
 * Sadece rakam kabul eder; boşlukları gruplar arasına kendisi ekler.
 */
@Directive({
  selector: '[appTelefonMask]',
  standalone: true,
})
export class TelefonMaskDirective {
  constructor(@Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Sadece rakamları al, max 11 hane
    const digits = input.value.replace(/\D/g, '').slice(0, 11);

    // Grupla: XXXX XXX XX XX
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 4);
    if (digits.length > 4) formatted += ' ' + digits.slice(4, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    if (digits.length > 9) formatted += ' ' + digits.slice(9, 11);

    // Input görseli güncelle
    input.value = formatted;

    // Form control değerini güncelle
    this.ngControl.control?.setValue(formatted, { emitEvent: true });
  }
}
