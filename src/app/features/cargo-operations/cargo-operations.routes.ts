import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const CARGO_OPERATIONS_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'gonderiler',
    loadComponent: () => import('./pages/shipment-list/shipment-list.component').then((m) => m.ShipmentListComponent),
  },
  {
    path: 'gonderiler/yeni',
    loadComponent: () => import('./pages/shipment-form/shipment-form.component').then((m) => m.ShipmentFormComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { roller: ['operasyon-uzmani', 'kurye-sorumlusu'] },
    canActivate: [roleGuard()],
  },
  {
    path: 'gonderiler/:id/duzenle',
    loadComponent: () => import('./pages/shipment-form/shipment-form.component').then((m) => m.ShipmentFormComponent),
    canDeactivate: [unsavedChangesGuard],
    data: { roller: ['operasyon-uzmani', 'kurye-sorumlusu'] },
    canActivate: [roleGuard()],
  },
  {
    path: 'gonderiler/:id',
    loadComponent: () => import('./pages/shipment-detail/shipment-detail.component').then((m) => m.ShipmentDetailComponent),
  },
  {
    path: 'kurye-atama',
    loadComponent: () => import('./pages/courier-assignment/courier-assignment.component').then((m) => m.CourierAssignmentComponent),
  },
  {
    path: 'teslimatlar',
    loadComponent: () => import('./pages/deliveries/deliveries.component').then((m) => m.DeliveriesComponent),
  },
  {
    path: 'iadeler',
    loadComponent: () => import('./pages/returns/returns.component').then((m) => m.ReturnsComponent),
  },
  {
    path: 'bolgeler',
    loadComponent: () => import('./pages/zones/zones.component').then((m) => m.ZonesComponent),
  },
  {
    path: 'raporlar',
    loadComponent: () => import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./pages/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
