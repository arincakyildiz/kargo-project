import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Boşluk, tire, parantez temizlendikten sonra "0" + 10 rakam (toplam 11 hane) beklenir. */
const TELEFON_REGEX = /^0\d{10}$/;

/**
 * Türkiye telefon biçimini doğrular ama biçimlendirmeye zorlamaz:
 * "0532 111 22 33" de "05321112233" de geçerlidir (boşluk/tire/parantez serbest).
 */
export function telefonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const temiz = String(control.value).replace(/[\s()-]/g, '');
    return TELEFON_REGEX.test(temiz) ? null : { telefonGecersiz: true };
  };
}

export function pozitifSayiValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    return Number(control.value) > 0 ? null : { pozitifDegil: true };
  };
}
