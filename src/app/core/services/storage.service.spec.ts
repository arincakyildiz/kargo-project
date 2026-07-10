import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('yazılan değeri okur', () => {
    service.write('test-key', { a: 1 });
    expect(service.read<{ a: number } | null>('test-key', null)).toEqual({ a: 1 });
  });

  it('anahtar yoksa fallback döner', () => {
    expect(service.read('olmayan-anahtar', 'varsayilan')).toBe('varsayilan');
  });

  it('silinen anahtar için fallback döner', () => {
    service.write('silinecek', 'deger');
    service.remove('silinecek');
    expect(service.read('silinecek', 'yok')).toBe('yok');
  });
});
