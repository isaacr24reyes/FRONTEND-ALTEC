// src/app/authentication/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userInfoString = sessionStorage.getItem('userInfo');
    if (!userInfoString) {
      this.router.navigate(['/authentication/login']);
      return false;
    }
    const userInfo = JSON.parse(userInfoString);
    const role = userInfo?.role;
    if (role === 'Distribuidor') {
      this.router.navigate(['/store']);
      return false;
    }

    return true;
  }
}
