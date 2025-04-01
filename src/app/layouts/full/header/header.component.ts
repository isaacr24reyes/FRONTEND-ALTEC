import { Component, OnInit } from '@angular/core';
import {R_AUTHENTICATION, R_LOGIN} from "../../../constants/route.constants";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(private _router: Router) { }

  ngOnInit(): void {
  }
  public logout(): void {
    sessionStorage.clear();
    this._router.navigate([`${R_AUTHENTICATION}/${R_LOGIN}`])
  }
}
