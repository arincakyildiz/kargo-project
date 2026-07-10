import { TarihPipe } from './tarih.pipe';

describe('TarihPipe', () => {
  const pipe = new TarihPipe();

  it('boş değer için tire döner', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('geçersiz tarih için tire döner', () => {
    expect(pipe.transform('gecersiz-tarih')).toBe('—');
  });

  it('geçerli bir ISO tarihini biçimlendirir', () => {
    const sonuc = pipe.transform('2026-01-15T10:30:00.000Z', false);
    expect(sonuc).not.toBe('—');
    expect(sonuc).toContain('2026');
  });
});
