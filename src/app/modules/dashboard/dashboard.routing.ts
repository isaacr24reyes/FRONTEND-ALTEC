import {Routes} from '@angular/router';
import {DemoComponent} from './components/demo/demo.component';
import {AuthGuard} from "../../core/guard/auth.guard";
import {HomeComponent} from "./components/home/home.component";
import {CodeGeneratorComponent} from "./components/code-generator/code-generator.component";


export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'code-generator',
    component: CodeGeneratorComponent,
    canActivate: [AuthGuard]
  }
];
