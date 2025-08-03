import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CartService} from "../../../../shared/services/CartService";
import {LoaderComponent} from "../../../../shared/components/LoaderComponent";
import {Router} from "@angular/router";
import {FormsModule, ReactiveFormsModule, UntypedFormGroup} from "@angular/forms";
import Notiflix from "notiflix";
import { FormGroup, FormBuilder } from '@angular/forms';


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

  constructor(private cartService: CartService,private router: Router,private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({});
    this.cart = this.cartService.getCart();
    this.calculateTotal();
  }

  onCantidadChange(item: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cantidad = Math.max(1, parseInt(inputElement.value, 10));

    if (item.cantidad !== cantidad) {
      item.cantidad = cantidad;
      this.recalcularTotal();
    }
  }




  calculateTotal(): void {
    this.total = this.cart.reduce((sum, item) => sum + item.pvp * item.cantidad, 0);
  }
  recalcularTotal() {
    this.total = this.cart.reduce((acc, item) => acc + item.pvp * item.cantidad, 0);
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
  finalizarCompra(): void {
    if (this.cart.length === 0) return;

    let message = '🧾 *Cotización de productos*%0A%0A'; // %0A = salto de línea
    this.cart.forEach((item, index) => {
      message += `*${index + 1}.* ${item.descripcion}%0A`;
      message += `Cantidad: ${item.cantidad}%0A`;
      message += `PVP: $${item.pvp.toFixed(2)}%0A`;
      message += `Subtotal: $${(item.pvp * item.cantidad).toFixed(2)}%0A%0A`;
    });

    message += `🟢 *Total: $${this.total.toFixed(2)}*%0A`;
    message += `%0AGracias por su preferencia.`;

    const phone = '593995159078'; // Ecuador (593 + número sin 0)
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    window.open(whatsappUrl, '_blank');
  }


  goBackToStore(): void {
    this.router.navigate(['/store']);
  }

  onSubmit() {

  }
}
