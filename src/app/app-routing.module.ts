import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AppBlankComponent} from "./layouts/blank/blank.component";
import {FullComponent} from "./layouts/full/full.component";
import {
  R_404, R_ALTEC_POINTS,
  R_AUTHENTICATION,
  R_DASHBOARD,
  R_PRODUCT_QUOTE,
  R_STORE,
  R_WAREHOUSE
} from "./constants/route.constants";

const routes: Routes = [
  {
    path: '',
    component: AppBlankComponent,
    loadChildren: () => import('./modules/landing-page/landing-page.module').then(m => m.LandingPageModule)
  },

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
//  { path: '', redirectTo: `${R_DASHBOARD}`, pathMatch: 'full' },
  { path: '**', redirectTo: `${R_AUTHENTICATION}/${R_404}` }
  ,
  {
    path: R_PRODUCT_QUOTE,
    component: FullComponent,
    loadChildren: () => import('./modules/product-quote/product-quote.module').then(mod => mod.ProductQuoteModule)
  },
  {
    path: R_STORE,
    component: FullComponent,
    loadChildren: () => import('./modules/store/store.module').then(mod => mod.StoreModule)
  },
  {
    path: R_ALTEC_POINTS,
    component: FullComponent,
    loadChildren: () => import('./modules/altec-points/altec-points.module').then(mod => mod.AltecPointsModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
