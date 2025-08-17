import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '../../app-material.module';
import { AppTranslationLanguageModule } from '../../app-translation-language.module';
import { ReactiveFormsModule } from '@angular/forms';
import {AltecPointsComponent} from "./components/altec-points.component";
import {ALTEC_POINTS_ROUTES} from "./altec-points.routing";


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    AppMaterialModule,
    AppTranslationLanguageModule,
    ReactiveFormsModule,
    RouterModule.forChild(ALTEC_POINTS_ROUTES),
    AltecPointsComponent,

  ]
})
export class AltecPointsModule {  }
