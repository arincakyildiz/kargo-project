import { BaseModel } from '../../../core/models/base-model';

export interface DeliveryZone extends BaseModel {
  ad: string;
  il: string;
  ilce: string;
  aktifMi: boolean;
}

export interface CustomerAddress extends BaseModel {
  aliciAdSoyad: string;
  telefon: string;
  acikAdres: string;
  bolgeId: string;
}
