import { ShipmentStatus } from './shipment.model';

/** Dashboard/rapor ekranları için hesaplanmış özet veri; kalıcı değildir. */
export interface OperationMetric {
  toplamGonderi: number;
  statusDagilimi: Record<ShipmentStatus, number>;
  teslimEdildiOrani: number;
  geciken: number;
  iadeOrani: number;
}
