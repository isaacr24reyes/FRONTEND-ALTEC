import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AppMaterialModule} from "../../app-material.module";
import {AppTranslationLanguageModule} from "../../app-translation-language.module";
import {ReactiveFormsModule} from "@angular/forms";
import {PRODUCT_QUOTE_ROUTES} from "./product-quote.routing";
import {ProductQuoteComponent} from "./components/product-quote.component";
import {CarShopComponent} from "./car-shop/car-shop.component";

@NgModule({
  declarations: [ProductQuoteModule.COMPONENT],
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    RouterModule.forChild(PRODUCT_QUOTE_ROUTES),
    ReactiveFormsModule,
    CarShopComponent,
  ]
})
export class ProductQuoteModule {

  static COMPONENT = [
    ProductQuoteComponent
  ]
}
