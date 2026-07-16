import { TestBed } from '@angular/core/testing';
import { StatusLabelPipe } from './status-label.pipe';
import { LanguageService } from '../../core/services/language.service';
import { StorageService } from '../../core/services/storage.service';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatusLabelPipe,
        LanguageService,
        StorageService
      ]
    });
    pipe = TestBed.inject(StatusLabelPipe);
  });

  it('durum kodunu aktif dile göre çevirir', () => {
    expect(pipe.transform('teslim-edildi')).toBe('Teslim Edildi');
    expect(pipe.transform('dagitimda')).toBe('Dağıtımda');
  });
});
