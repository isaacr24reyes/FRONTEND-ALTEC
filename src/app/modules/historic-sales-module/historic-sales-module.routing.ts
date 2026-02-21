import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guard/auth.guard';
import { HistoricSalesModuleComponent } from './components/historic-sales-module.component';

export const HISTORIC_SALES_MODULE_ROUTES: Routes = [
    {
        path: '',
        component: HistoricSalesModuleComponent,
        canActivate: [AuthGuard],
    },
];
