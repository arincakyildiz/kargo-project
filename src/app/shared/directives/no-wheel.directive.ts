import { Directive, HostListener } from '@angular/core';

/**
 * Sayı inputlarında mouse tekerleği (scroll) ile değerin değişmesini engeller.
 * UX sorunu: kullanıcı sayfayı scroll ederken kapasite/ağırlık değerleri kazara değişiyordu.
 */
@Directive({
  selector: 'input[type="number"][appNoWheel]',
  standalone: true,
})
export class NoWheelDirective {
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
  }
}
