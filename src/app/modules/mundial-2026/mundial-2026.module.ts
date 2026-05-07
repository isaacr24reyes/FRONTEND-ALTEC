import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Mundial2026Component } from './mundial-2026.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: Mundial2026Component }]),
    Mundial2026Component
  ]
})
export class Mundial2026Module {}
