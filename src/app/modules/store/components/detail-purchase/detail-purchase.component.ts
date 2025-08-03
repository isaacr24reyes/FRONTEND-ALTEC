import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CartService} from "../../../../shared/services/CartService";
import {LoaderComponent} from "../../../../shared/components/LoaderComponent";
import {Router} from "@angular/router";
import {FormsModule, ReactiveFormsModule, UntypedFormGroup} from "@angular/forms";
import Notiflix from "notiflix";


@Component({
  selector: 'app-detail-purchase',
  standalone: true,
  imports: [CommonModule, LoaderComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './detail-purchase.component.html',
  styleUrl: './detail-purchase.component.scss'
})
export class DetailPurchaseComponent implements OnInit {
  cart: any[] = [];
  total: number = 0;
  public formGroup!: UntypedFormGroup;
  constructor(private cartService: CartService,private router: Router) {}

  ngOnInit(): void {
    this.cart = this.cartService.getCart();
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.total = this.cart.reduce((sum, item) => sum + item.pvp * item.cantidad, 0);
  }

  removeItem(productId: string): void {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.cartService.setCart(this.cart);
    this.calculateTotal();
    if (this.cart.length === 0) {
      Notiflix.Report.info(
        'Carrito vacío',
        'Tu carrito está vacío.<br>¡Sigue explorando nuestros productos!',
        'Ir a la tienda',
        () => this.router.navigate(['/store'])
      );
    }
  }


  goBackToStore(): void {
    this.router.navigate(['/store']);
  }

  onSubmit() {

  }
}
