import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { ShipmentStatus } from '../../features/cargo-operations/models/shipment.model';

const STATUS_RENK: Record<ShipmentStatus, string> = {
  olusturuldu: '#3B82F6',
  'kurye-atandi': '#3B82F6',
  dagitimda: '#F59E0B',
  'teslim-edildi': '#22C55E',
  'teslim-edilemedi': '#DC2626',
  'iade-talebi': '#EF4444',
  'iade-edildi': '#EF4444',
  'iptal-edildi': '#64748B',
};

/** Gönderi durumuna göre rozet rengini uygular. */
@Directive({
  selector: '[appStatusBadge]',
  standalone: true,
})
export class StatusBadgeDirective implements OnChanges {
  @Input('appStatusBadge') status!: ShipmentStatus;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const renk = STATUS_RENK[this.status] ?? '#64748B';
    this.renderer.addClass(this.el.nativeElement, 'status-badge');
    this.renderer.setStyle(this.el.nativeElement, 'background-color', `${renk}1a`);
    this.renderer.setStyle(this.el.nativeElement, 'color', renk);
    this.renderer.setStyle(this.el.nativeElement, 'border', `1px solid ${renk}`);
  }
}
