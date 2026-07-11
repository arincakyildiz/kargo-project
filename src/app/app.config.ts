import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { DEMO_SEED_PROVIDER } from './core/services/demo-seed';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), DEMO_SEED_PROVIDER],
};
