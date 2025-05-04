// user-session.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {

  private userInfoSubject = new BehaviorSubject<any>(this.getUserInfoFromLocalStorage());

  constructor() {}

  getUserInfo() {
    return this.userInfoSubject.asObservable();
  }

  setUserInfo(userInfo: any) {
    // Guardamos el userInfo en localStorage
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    this.userInfoSubject.next(userInfo);
  }

  private getUserInfoFromLocalStorage() {
    const storedUserInfo = localStorage.getItem('userInfo');
    return storedUserInfo ? JSON.parse(storedUserInfo) : null;
  }

  logout() {
    localStorage.removeItem('userInfo');
    this.userInfoSubject.next(null);
  }
}
