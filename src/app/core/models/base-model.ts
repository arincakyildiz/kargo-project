export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type Rol = 'operasyon-uzmani' | 'kurye-sorumlusu' | 'musteri-hizmetleri';

export interface AuditLogEntry {
  id: string;
  islemTipi: string;
  islemZamani: string;
  rol: Rol;
  aciklama: string;
  eskiDeger?: string;
  yeniDeger?: string;
  hedefId?: string;
}
