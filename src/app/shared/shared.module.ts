import {Injector, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {OnlyLettersDirective} from "./directive/only-letters.directive";
import {ConvertFrom24To12FormatPipe} from "./pipe/convert-from-24-to-12-format.pipe";

export let InjectorInstance: Injector;

@NgModule({
  declarations: [
    OnlyLettersDirective,
    ConvertFrom24To12FormatPipe
  ],
  exports: [
    OnlyLettersDirective,
    ConvertFrom24To12FormatPipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule {
  constructor(private injector: Injector) {
    InjectorInstance = this.injector;
  }
}
