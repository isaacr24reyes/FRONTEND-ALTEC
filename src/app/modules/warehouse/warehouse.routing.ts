import {Routes} from '@angular/router';
import {AuthGuard} from "../../core/guard/auth.guard";
import {InventarioComponent} from "./components/inventario/inventario.component";
import {AddProductComponent} from "./components/add-product/add-product.component";
import {EditProductComponent} from "./components/edit-product/edit-product.component";



export const WAREHOUSE_ROUTES: Routes = [
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-product',
    component: AddProductComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-product',
    component: EditProductComponent,
    canActivate: [AuthGuard]
  }
];
