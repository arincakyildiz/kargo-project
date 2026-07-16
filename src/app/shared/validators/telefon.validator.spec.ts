import { FormControl } from '@angular/forms';
import { pozitifSayiValidator, telefonValidator } from './telefon.validator';

describe('telefonValidator', () => {
  const validator = telefonValidator();

  it('boş değeri geçerli sayar (required ile birlikte kullanılmalı)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('doğru biçimli veya birleşik yazılan telefonu kabul eder', () => {
    expect(validator(new FormControl('0532 111 22 33'))).toBeNull();
    expect(validator(new FormControl('05321112233'))).toBeNull();
  });

  it('yanlış biçimli telefonu reddeder', () => {
    expect(validator(new FormControl('abc'))).toEqual({ telefonGecersiz: true });
    expect(validator(new FormControl('12345678901'))).toEqual({ telefonGecersiz: true });
  });
});

describe('pozitifSayiValidator', () => {
  const validator = pozitifSayiValidator();

  it('pozitif sayıyı kabul eder', () => {
    expect(validator(new FormControl(2.5))).toBeNull();
  });

  it('sıfır veya negatif sayıyı reddeder', () => {
    expect(validator(new FormControl(0))).toEqual({ pozitifDegil: true });
    expect(validator(new FormControl(-1))).toEqual({ pozitifDegil: true });
  });

  it('boş değeri geçerli sayar (required ile birlikte kullanılmalı)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});
