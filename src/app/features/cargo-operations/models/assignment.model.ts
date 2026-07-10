import { BaseModel } from '../../../core/models/base-model';

export interface Assignment extends BaseModel {
  shipmentId: string;
  kuryeId: string;
  atamaTarihi: string;
  aktifMi: boolean;
  iptalNedeni?: string;
}

export interface DeliveryProof extends BaseModel {
  shipmentId: string;
  teslimAlanAdSoyad: string;
  imzaVarMi: boolean;
  fotografUrl?: string;
  not?: string;
}

export type ReturnRequestStatus = 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi';

export interface ReturnRequest extends BaseModel {
  shipmentId: string;
  neden: string;
  status: ReturnRequestStatus;
  islemeAlanRol?: string;
}
