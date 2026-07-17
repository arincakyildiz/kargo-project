import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/base-model';
import { CurrentUserService } from '../services/current-user.service';
import { NotificationService } from '../services/notification.service';
import { LanguageService } from '../services/language.service';

/** Route data'sında `roller: Rol[]` beklenir. */
export function roleGuard(): CanActivateFn {
  return (route) => {
    const currentUser = inject(CurrentUserService);
    const router = inject(Router);
    const notification = inject(NotificationService);
    const langService = inject(LanguageService);
    const izinliRoller = (route.data['roller'] as Rol[] | undefined) ?? [];

    if (izinliRoller.length === 0 || currentUser.yetkiVarMi(izinliRoller)) {
      return true;
    }

    notification.error(langService.translate('access_denied'));
    return router.createUrlTree(['/dashboard']);
  };
}
