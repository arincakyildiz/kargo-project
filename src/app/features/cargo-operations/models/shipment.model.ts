import { BaseModel } from '../../../core/models/base-model';

export type ShipmentStatus =
  | 'olusturuldu'
  | 'kurye-atandi'
  | 'dagitimda'
  | 'teslim-edildi'
  | 'teslim-edilemedi'
  | 'iade-talebi'
  | 'iade-edildi'
  | 'iptal-edildi';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  olusturuldu: 'Oluşturuldu',
  'kurye-atandi': 'Kurye Atandı',
  dagitimda: 'Dağıtımda',
  'teslim-edildi': 'Teslim Edildi',
  'teslim-edilemedi': 'Teslim Edilemedi',
  'iade-talebi': 'İade Talebi',
  'iade-edildi': 'İade Edildi',
  'iptal-edildi': 'İptal Edildi',
};

/** Durum rozetleri ve grafiklerde kullanılan tek renk kaynağı. */
export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  olusturuldu: '#3b82f6',
  'kurye-atandi': '#6366f1',
  dagitimda: '#f59e0b',
  'teslim-edildi': '#22c55e',
  'teslim-edilemedi': '#dc2626',
  'iade-talebi': '#ef4444',
  'iade-edildi': '#f43f5e',
  'iptal-edildi': '#64748b',
};

/** Tanımlı workflow: anahtar durumdan yalnızca listedeki durumlara geçilebilir. */
export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  olusturuldu: ['kurye-atandi', 'iptal-edildi'],
  'kurye-atandi': ['dagitimda', 'iptal-edildi'],
  dagitimda: ['teslim-edildi', 'teslim-edilemedi', 'iade-talebi'],
  'teslim-edilemedi': ['dagitimda', 'iade-talebi'],
  'teslim-edildi': [],
  'iade-talebi': ['iade-edildi'],
  'iade-edildi': [],
  'iptal-edildi': [],
};

export interface Shipment extends BaseModel {
  takipKodu: string;
  aliciAdSoyad: string;
  aliciTelefon: string;
  adresId: string;
  bolgeId: string;
  agirlikKg: number;
  aciklama?: string;
  status: ShipmentStatus;
  kuryeId?: string;
}

export interface StatusHistoryEntry {
  id: string;
  shipmentId: string;
  eskiStatus: ShipmentStatus | null;
  yeniStatus: ShipmentStatus;
  aciklama: string;
  islemZamani: string;
  islemYapanRol: string;
}
