import { Pipe, PipeTransform } from '@angular/core';
import { SHIPMENT_STATUS_LABELS, ShipmentStatus } from '../../features/cargo-operations/models/shipment.model';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status] ?? status;
  }
}
