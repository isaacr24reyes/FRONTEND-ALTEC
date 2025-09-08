import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: any[] = [];
  private cartItemCountSubject = new BehaviorSubject<number>(0);
  cartItemCount$ = this.cartItemCountSubject.asObservable();

  private scopeKey = this.computeScopeKey(); // p.ej. 'guest' | 'distribuidor' | 'admin'

  constructor() {
    this.loadCartFromStorage();
  }

  /** Lee userInfo de sessionStorage y define el scope actual */
  private computeScopeKey(): string {
    const userInfoStr = sessionStorage.getItem('userInfo');
    if (!userInfoStr) return 'guest';

    try {
      const user = JSON.parse(userInfoStr);
      // Normaliza el rol a minúsculas
      const role = (user?.role ?? 'guest').toLowerCase();
      // Si quieres aislar por usuario, agrega username: `${role}_${user?.username || 'anon'}`
      return role; // 'distribuidor', 'admin', etc.
    } catch {
      return 'guest';
    }
  }

  /** Clave efectiva para el carrito del scope actual */
  private get CART_KEY(): string {
    return `cartItems_${this.scopeKey}`;
  }

  /** Llama esto cuando cambie el usuario/rol (login/logout) */
  public switchScope(): void {
    this.scopeKey = this.computeScopeKey();
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const stored = sessionStorage.getItem(this.CART_KEY);
    this.cartItems = stored ? JSON.parse(stored) : [];
    this.updateCount();
  }

  private saveCartToStorage(): void {
    sessionStorage.setItem(this.CART_KEY, JSON.stringify(this.cartItems));
  }

  /** Opcional: limpiar SOLO el carrito del scope actual */
  public clearCart(): void {
    this.cartItems = [];
    sessionStorage.removeItem(this.CART_KEY);
    this.updateCount();
  }

  /** Si prefieres limpiar TODOS los carritos de la sesión (guest, distribuidor, etc.) */
  public clearAllCartsInSession(): void {
    // Elimina todas las posibles claves de carritos en esta sesión
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('cartItems_'))
      .forEach(k => sessionStorage.removeItem(k));
    this.cartItems = [];
    this.updateCount();
  }

  getCart(): any[] {
    return [...this.cartItems]; // copia, evita mutaciones externas
  }

  setCart(newCart: any[]): void {
    this.cartItems = [...newCart];
    this.saveCartToStorage();
    this.updateCount();
  }

  addToCart(product: any): void {
    const descripcion = product.descripcion?.toLowerCase() || '';
    let existing: any;

    const matchByDescripcion =
      (descripcion.includes('resistencia') && product.descripcion.includes('1/4 W')) ||
      (descripcion.includes('led') && descripcion.includes('diodo'));

    if (matchByDescripcion) {
      existing = this.cartItems.find(
        p => p.id === product.id && p.descripcion === product.descripcion
      );
    } else {
      existing = this.cartItems.find(p => p.id === product.id);
    }

    if (existing) {
      existing.cantidad += product.cantidad;
    } else {
      this.cartItems.push({ ...product });
    }

    this.saveCartToStorage();
    this.updateCount();
  }

  private updateCount(): void {
    // Si quieres contar unidades totales:
    // const count = this.cartItems.reduce((sum, i) => sum + (i.cantidad || 0), 0);
    const count = this.cartItems.length; // ítems distintos
    this.cartItemCountSubject.next(count);
  }
}
