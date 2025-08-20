import { Component, OnInit } from '@angular/core';
import {
  R_ALTEC_POINTS,
  R_AUTHENTICATION,
  R_LOGIN,
  R_PRODUCT_QUOTE,
  R_WAREHOUSE
} from "../../../constants/route.constants";
import {Router} from "@angular/router";
import {UserSessionService} from "../../../modules/authentication/services/user-session.service";
import {CartService} from "../../../shared/services/CartService";
import Notiflix from "notiflix";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public role: string | null = null;
  public isExternal: boolean = false;
  cartItemCount: number = 0;
  constructor(private _router: Router, private _userSessionService: UserSessionService,private cartService: CartService) { }

  ngOnInit(): void {
    this.isExternal = sessionStorage.getItem('isExternal') === 'true';
    this._userSessionService.getUserInfo().subscribe(userInfo => {
      if (userInfo) {
        this.role = userInfo.role;
      }
    });
    this.cartService.cartItemCount$.subscribe(count => {
      this.cartItemCount = count;
    });
  }
  public logout(): void {
    sessionStorage.clear();
    this._router.navigate([`${R_AUTHENTICATION}/${R_LOGIN}`])
  }
  navigateToCotizador(): void {
    this._router.navigate([`/${R_PRODUCT_QUOTE}`]);

  }
  navigateToAltecPoints(): void {
    this._router.navigate([`/${R_ALTEC_POINTS}`]);

  }
  navigateToBodega(): void {
    this._router.navigate(['/warehouse/inventario']);
  }

  navigateToIngreso(): void {
    this._router.navigate(['/warehouse/add-product']);
  }
  navigateToCart(): void {
    const cart = this.cartService.getCart();

    if (cart.length === 0) {
      Notiflix.Report.info(
        'Carrito vacío',
        '¡Aún no has agregado productos!<br>Explora nuestra tienda y encuentra lo que necesitas 😊',
        'Ir a la tienda',
        () => this._router.navigate(['/store'])
      );

      return;
    }

    this._router.navigate(['/store/detail-purchase']);
  }


}
