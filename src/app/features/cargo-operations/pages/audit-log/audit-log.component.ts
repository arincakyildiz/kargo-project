import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { AuditService } from '../../../../core/services/audit.service';
import { TarihPipe } from '../../../../shared/pipes/tarih.pipe';
import { DebounceDirective } from '../../../../shared/directives/debounce.directive';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AuditLogEntry } from '../../../../core/models/base-model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

const SAYFA_BOYU_SECENEKLERI = [10, 20, 50, 100];

type SiralamaAnahtari = 'islemZamani-desc' | 'islemZamani-asc' | 'rol-asc';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, TarihPipe, DebounceDirective, EmptyStateComponent, IconComponent, TranslatePipe],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent {
  readonly log = this.audit.log;

  readonly arama = signal('');
  readonly islemTipiFiltre = signal<string>('tumu');
  readonly siralama = signal<SiralamaAnahtari>('islemZamani-desc');
  readonly sayfa = signal(1);
  readonly sayfaBoyu = signal(SAYFA_BOYU_SECENEKLERI[1]); // Varsayılan 20
  readonly sayfaBoyuSecenekleri = SAYFA_BOYU_SECENEKLERI;
  readonly seciliKayit = signal<AuditLogEntry | null>(null);

  private readonly siralamaFonksiyonlari: Record<SiralamaAnahtari, (a: AuditLogEntry, b: AuditLogEntry) => number> = {
    'islemZamani-desc': (a, b) => b.islemZamani.localeCompare(a.islemZamani),
    'islemZamani-asc': (a, b) => a.islemZamani.localeCompare(b.islemZamani),
    'rol-asc': (a, b) => a.rol.localeCompare(b.rol),
  };

  readonly islemTipleri = computed(() => {
    const tipler = new Set(this.log().map((e) => e.islemTipi));
    return [...tipler].sort();
  });

  readonly filtrelenmis = computed(() => {
    const aramaMetni = this.arama().trim().toLowerCase();
    const tip = this.islemTipiFiltre();
    return this.log()
      .filter((e) => (tip === 'tumu' ? true : e.islemTipi === tip))
      .filter((e) => (aramaMetni ? e.aciklama.toLowerCase().includes(aramaMetni) : true))
      .sort(this.siralamaFonksiyonlari[this.siralama()]);
  });

  readonly toplamSayfa = computed(() => Math.max(1, Math.ceil(this.filtrelenmis().length / this.sayfaBoyu())));

  /** Aktif sayfayı her zaman geçerli aralıkta tutar; veri küçülünce boş sayfada kalmayı önler. */
  readonly gecerliSayfa = computed(() => Math.min(this.sayfa(), this.toplamSayfa()));

  readonly sayfalanmis = computed(() => {
    const baslangic = (this.gecerliSayfa() - 1) * this.sayfaBoyu();
    return this.filtrelenmis().slice(baslangic, baslangic + this.sayfaBoyu());
  });

  constructor(private audit: AuditService) {}

  aramaDegisti(deger: string): void {
    this.arama.set(deger);
    this.sayfa.set(1);
  }

  tipFiltresiDegisti(tip: string): void {
    this.islemTipiFiltre.set(tip);
    this.sayfa.set(1);
  }

  siralamaDegisti(deger: string): void {
    this.siralama.set(deger as SiralamaAnahtari);
    this.sayfa.set(1);
  }

  sayfaBoyuDegisti(deger: string): void {
    this.sayfaBoyu.set(Number(deger));
    this.sayfa.set(1);
  }

  sayfayaGit(yeniSayfa: number): void {
    if (yeniSayfa < 1 || yeniSayfa > this.toplamSayfa()) return;
    this.sayfa.set(yeniSayfa);
  }

  /** 'kurye-atama' -> 'action_kurye_atama'. Regex, Angular şablon ifadesinde çalışmadığı için burada. */
  islemTipiCeviriAnahtari(islemTipi: string): string {
    return 'action_' + islemTipi.replace(/-/g, '_');
  }

  detayAc(entry: AuditLogEntry): void {
    this.seciliKayit.set(entry);
  }

  detayKapat(): void {
    this.seciliKayit.set(null);
  }
}
