import { Component, OnInit } from '@angular/core';
import {R_AUTHENTICATION, R_LOGIN} from "../../../constants/route.constants";
import {Router} from "@angular/router";
import {UserSessionService} from "../../../modules/authentication/services/user-session.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public role: string | null = null;
  constructor(private _router: Router, private _userSessionService: UserSessionService) { }

  ngOnInit(): void {
    this._userSessionService.getUserInfo().subscribe(userInfo => {
      if (userInfo) {
        this.role = userInfo.role;
      }
    });
  }
  public logout(): void {
    sessionStorage.clear();
    this._router.navigate([`${R_AUTHENTICATION}/${R_LOGIN}`])
  }
}
