import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

/**
 * Şablondaki metinleri aktif dile göre çevirir.
 * Örn: {{ 'dashboard' | translate }} veya {{ 'total_records' | translate:{ count: 5 } }}
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // Dil değiştiğinde anında tetiklenmesi için pure: false yapıyoruz.
})
export class TranslatePipe implements PipeTransform {
  constructor(private langService: LanguageService) {}

  transform(key: string, params?: Record<string, string | number>): string {
    return this.langService.translate(key, params);
  }
}
