import {Routes} from '@angular/router';
import {AuthGuard} from "../../core/guard/auth.guard";
import {ProductQuoteComponent} from "./components/product-quote.component";


export const PRODUCT_QUOTE_ROUTES: Routes = [
  {
    path: '',
    component: ProductQuoteComponent,
    canActivate: [AuthGuard]
  }
];
