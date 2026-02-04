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
  role: string = '';

  constructor(private cartService: CartService, private router: Router, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({});
    const userInfo = localStorage.getItem('userInfo');
    this.role = userInfo ? JSON.parse(userInfo).role.toLowerCase() : '';

    this.cart = this.cartService.getCart();
    this.calculateTotal();
  }

  itemPrecioUnitario(item: any): number {
    if (this.role === 'distribuidor' && item.precioMayorista !== undefined && item.precioMayorista !== null) {
      return item.precioMayorista;
    }
    return item.pvp;
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
    this.total = this.cart.reduce(
      (sum, item) => sum + this.itemPrecioUnitario(item) * item.cantidad,
      0
    );
  }

  recalcularTotal() {
    this.total = this.cart.reduce(
      (acc, item) => acc + this.itemPrecioUnitario(item) * item.cantidad,
      0
    );
  }

  removeItem(product: any): void {
    this.cart = this.cart.filter(item => {
      if (
        product.descripcion?.toLowerCase().includes('resistencia') &&
        product.descripcion.includes('1/4 W')
      ) {
        return !(item.id === product.id && item.descripcion === product.descripcion);
      }

      if (
        product.descripcion?.toLowerCase().includes('led') &&
        product.descripcion.toLowerCase().includes('diodo')
      ) {
        return !(item.id === product.id && item.descripcion === product.descripcion);
      }

      return item.id !== product.id;
    });

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

    let message = '🧾 *Cotización de productos*%0A%0A';

    this.cart.forEach((item, index) => {
      const precioUnitario = this.itemPrecioUnitario(item);
      message += `*${index + 1}.* ${item.descripcion}%0A`;
      message += `Cantidad: ${item.cantidad}%0A`;
      message += `Precio Unitario: $${precioUnitario.toFixed(2)}%0A`;
      message += `Subtotal: $${(precioUnitario * item.cantidad).toFixed(2)}%0A%0A`;
    });

    message += `🟢 *Total: $${this.total.toFixed(2)}*%0A`;
    message += `%0AGracias por su preferencia.`;

    const phone = '593995159078';
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  goBackToStore(): void {
    this.router.navigate(['/store']);
  }

  incrementQuantity(item: any): void {
    item.cantidad++;
    this.recalcularTotal();
  }

  decrementQuantity(item: any): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      this.recalcularTotal();
    }
  }

  onSubmit() {}
}

