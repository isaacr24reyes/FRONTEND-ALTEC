import { Routes } from '@angular/router';
import {AuthGuard} from "../../core/guard/auth.guard";
import {UserAdminComponent} from "./components/user-admin.component";

export const USER_ADMIN_ROUTES: Routes = [

  {
    path: '',
    component: UserAdminComponent,
    canActivate: [AuthGuard]
  }
];
