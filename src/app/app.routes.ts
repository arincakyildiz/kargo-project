import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/cargo-operations/cargo-operations.routes').then((m) => m.CARGO_OPERATIONS_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
