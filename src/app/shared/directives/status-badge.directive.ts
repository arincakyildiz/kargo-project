import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { SHIPMENT_STATUS_COLORS, ShipmentStatus } from '../../features/cargo-operations/models/shipment.model';

/** Gönderi durumuna göre rozet rengini uygular. */
@Directive({
  selector: '[appStatusBadge]',
  standalone: true,
})
export class StatusBadgeDirective implements OnChanges {
  @Input('appStatusBadge') status!: ShipmentStatus;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const renk = SHIPMENT_STATUS_COLORS[this.status] ?? '#64748b';
    this.renderer.addClass(this.el.nativeElement, 'status-badge');
    this.renderer.setStyle(this.el.nativeElement, 'background-color', `${renk}14`);
    this.renderer.setStyle(this.el.nativeElement, 'color', renk);
    this.renderer.setStyle(this.el.nativeElement, 'border-color', `${renk}40`);
  }
}
