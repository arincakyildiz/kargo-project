import { BaseModel } from '../../../core/models/base-model';

export interface Courier extends BaseModel {
  adSoyad: string;
  telefon: string;
  bolgeId: string;
  gunlukKapasite: number;
  aktifMi: boolean;
}

export interface CourierCapacity {
  kuryeId: string;
  tarih: string;
  kapasite: number;
  atananGonderiSayisi: number;
}
