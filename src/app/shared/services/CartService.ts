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
    const existing = this.cartItems.find(p => p.id === product.id);

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
