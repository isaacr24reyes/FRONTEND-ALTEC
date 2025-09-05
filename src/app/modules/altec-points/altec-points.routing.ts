import { Routes } from '@angular/router';
import {AltecPointsComponent} from "./components/altec-points.component";
import {AuthGuard} from "../../core/guard/auth.guard";




export const ALTEC_POINTS_ROUTES: Routes = [

  {
    path: '',
    component: AltecPointsComponent,
    canActivate: [AuthGuard]
  }
];
