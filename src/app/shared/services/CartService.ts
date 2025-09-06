import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: any[] = [];
  private cartItemCountSubject = new BehaviorSubject<number>(0);
  cartItemCount$ = this.cartItemCountSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const stored = sessionStorage.getItem('cartItems');

    if (stored) {
      this.cartItems = JSON.parse(stored);
      this.updateCount();
    }
  }

  private saveCartToStorage(): void {
    sessionStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  getCart(): any[] {
    return this.cartItems;
  }

  addToCart(product: any): void {
    const descripcion = product.descripcion?.toLowerCase() || '';
    let existing;

    const matchByDescripcion = (
      (descripcion.includes('resistencia') && product.descripcion.includes('1/4 W')) ||
      (descripcion.includes('led') && descripcion.includes('diodo'))
    );

    if (matchByDescripcion) {
      // Comparar por ID y descripción exacta
      existing = this.cartItems.find(p =>
        p.id === product.id && p.descripcion === product.descripcion
      );
    } else {
      // Comparar solo por ID
      existing = this.cartItems.find(p => p.id === product.id);
    }

    if (existing) {
      existing.cantidad += product.cantidad;
    } else {
      this.cartItems.push({ ...product });
    }

    this.updateCount();
    this.saveCartToStorage();
  }


  updateCount(): void {
    const count = this.cartItems.length;
    this.cartItemCountSubject.next(count);
  }
  setCart(newCart: any[]): void {
    this.cartItems = [...newCart];
    this.saveCartToStorage();
    this.updateCount();
  }
}
