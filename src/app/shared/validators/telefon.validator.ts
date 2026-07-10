import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const TELEFON_REGEX = /^0\d{3} \d{3} \d{2} \d{2}$/;

/** Beklenen biçim: "05XX XXX XX XX". */
export function telefonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return TELEFON_REGEX.test(control.value) ? null : { telefonGecersiz: true };
  };
}

export function pozitifSayiValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    return Number(control.value) > 0 ? null : { pozitifDegil: true };
  };
}
