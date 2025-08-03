import { Routes } from '@angular/router';
import {StoreComponent} from "./components/store.component";
import {DetailPurchaseComponent} from "./components/detail-purchase/detail-purchase.component";


export const STORE_ROUTES: Routes = [
  {
    path: '',
    component: StoreComponent
  },
  {
    path: 'detail-purchase',
    component: DetailPurchaseComponent
  }
];
