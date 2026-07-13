import { Directive, Input, TemplateRef, ViewContainerRef, effect, signal } from '@angular/core';
import { Rol } from '../../core/models/base-model';
import { CurrentUserService } from '../../core/services/current-user.service';

/**
 * Yapısal direktif: *appYetki="['operasyon-uzmani']"
 * İzinli rollerde içeriği normal gösterir. Yetki yoksa:
 * - 'hide' modunda içeriği DOM'dan gizler (varsayılan).
 * - 'blur' modunda içeriği bulanıklaştırıp üzerine "Erişilemez" overlay'i ekler.
 */
@Directive({
  selector: '[appYetki]',
  standalone: true,
})
export class YetkiDirective {
  private readonly izinliRoller = signal<Rol[]>([]);
  private readonly mode = signal<'hide' | 'blur'>('hide');

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private currentUser: CurrentUserService
  ) {
    effect(() => {
      const yetkiVar = this.currentUser.yetkiVarMi(this.izinliRoller());
      const currentMode = this.mode();
      
      this.viewContainer.clear();
      
      if (yetkiVar) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else if (currentMode === 'blur') {
        const viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
        viewRef.rootNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            element.classList.add('yetki-blur-aktif');
          }
        });
      }
    });
  }

  @Input()
  set appYetki(roller: Rol[]) {
    this.izinliRoller.set(roller);
  }

  @Input()
  set appYetkiMode(mode: 'hide' | 'blur') {
    this.mode.set(mode);
  }
}
