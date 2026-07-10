import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  kaydedilmemisDegisiklikVarMi(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component.kaydedilmemisDegisiklikVarMi()) {
    return true;
  }
  return confirm('Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?');
};
