import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { Rol } from '../../core/models/base-model';
import { CurrentUserService } from '../../core/services/current-user.service';

/**
 * Yapısal direktif: *appYetki="['operasyon-uzmani']" — yalnızca izinli
 * rollerde içeriği DOM'a ekler.
 */
@Directive({
  selector: '[appYetki]',
  standalone: true,
})
export class YetkiDirective {
  private izinliRoller: Rol[] = [];
  private eklendiMi = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private currentUser: CurrentUserService
  ) {
    effect(() => {
      const yetkiVar = this.currentUser.yetkiVarMi(this.izinliRoller);
      if (yetkiVar && !this.eklendiMi) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.eklendiMi = true;
      } else if (!yetkiVar && this.eklendiMi) {
        this.viewContainer.clear();
        this.eklendiMi = false;
      }
    });
  }

  @Input()
  set appYetki(roller: Rol[]) {
    this.izinliRoller = roller;
  }
}
