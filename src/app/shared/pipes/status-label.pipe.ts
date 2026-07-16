import { Pipe, PipeTransform } from '@angular/core';
import { ShipmentStatus } from '../../features/cargo-operations/models/shipment.model';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'statusLabel',
  standalone: true,
  pure: false
})
export class StatusLabelPipe implements PipeTransform {
  constructor(private langService: LanguageService) {}

  transform(status: ShipmentStatus): string {
    const key = `status_${status.replace(/-/g, '_')}`;
    return this.langService.translate(key);
  }
}
