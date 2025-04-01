import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { R_AUTHENTICATION, R_LOGIN } from "../../constants/route.constants";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(public _router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean> | Promise<boolean> | UrlTree | boolean {
    if (!sessionStorage.getItem('token'))
      this._router.navigate([`${R_AUTHENTICATION}/${R_LOGIN}`]).then();
    return true;
  }

}
