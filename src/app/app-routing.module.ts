import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AppBlankComponent} from "./layouts/blank/blank.component";
import {FullComponent} from "./layouts/full/full.component";
import {R_404, R_AUTHENTICATION, R_DASHBOARD, R_WAREHOUSE} from "./constants/route.constants";

const routes: Routes = [
  {
    path: R_DASHBOARD,
    component: FullComponent,
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(mod => mod.DashboardModule)
  },
  {
    path: R_WAREHOUSE,
    component: FullComponent,
    loadChildren: () => import('./modules/warehouse/warehouse.module').then(mod => mod.WarehouseModule)
  },
  {
    path: R_AUTHENTICATION,
    component: AppBlankComponent,
    loadChildren: () => import('./modules/authentication/authentication.module').then(mod => mod.AuthenticationModule)
  },
  { path: '', redirectTo: `${R_DASHBOARD}`, pathMatch: 'full' },
  { path: '**', redirectTo: `${R_AUTHENTICATION}/${R_404}` }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
