import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { R_LOGIN, R_REGISTER } from "../../constants/route.constants";
import { UserGuard } from "../../core/guard/user.guard";

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [UserGuard],
    children: [
      {
        path: R_LOGIN,
        component: LoginComponent,
        canActivate: [UserGuard]
      },
      {
        path: R_REGISTER,
        component: RegisterComponent,
        canActivate: [UserGuard]
      }
    ]
  }
];
