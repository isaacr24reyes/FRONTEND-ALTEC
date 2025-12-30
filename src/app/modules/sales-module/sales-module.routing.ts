import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guard/auth.guard';
import { SalesModuleComponent } from './components/sales-module.component';

export const SALES_MODULE_ROUTES: Routes = [
  {
    path: '',
    component: SalesModuleComponent,
    canActivate: [AuthGuard],
  },
];
