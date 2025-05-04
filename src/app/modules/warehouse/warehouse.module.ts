import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AppMaterialModule} from "../../app-material.module";
import {AppTranslationLanguageModule} from "../../app-translation-language.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {WAREHOUSE_ROUTES} from "./warehouse.routing";
import {InventarioComponent} from "./components/inventario/inventario.component";
import {AddProductComponent} from "./components/add-product/add-product.component";
import {ExtraProductInfoComponent} from "./components/extra-product-info/extra-product-info.component";

@NgModule({
  declarations: [
    AddProductComponent,
    InventarioComponent,
    ExtraProductInfoComponent
  ],
    imports: [
        CommonModule,
        AppMaterialModule,
        AppTranslationLanguageModule,
        RouterModule.forChild(WAREHOUSE_ROUTES),
        ReactiveFormsModule,
        FormsModule,
    ]
})
export class WarehouseModule {}
