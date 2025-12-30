import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../../warehouse/services/warehouse.service';
import Notiflix from 'notiflix';

interface CartItem {
  descripcion: string;
  pvp: number;
  cantidad: number;
}

@Component({
  selector: 'app-sales-module',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sales-module.component.html',
  styleUrls: ['./sales-module.component.scss']
})
export class SalesModuleComponent implements OnInit {

  formGroup!: FormGroup;

  // 🧑 Cliente
  cliente = {
    nombre: '',
    celular: '',
    rol: 'cliente'
  };

  // 📦 Productos
  allProducts: any[] = [];
  products: any[] = [];

  // 🛒 Carrito
  cartItems: CartItem[] = [];

  private readonly MAX_RESULTS = 6;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: ['']
    });

    this.getAllProducts();

    this.formGroup.get('searchControl')!
      .valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        this.applyFilter(value);
      });
  }

  confirmVenta(): void {
    Notiflix.Confirm.show(
      'Confirmar venta',
      '¿Seguro deseas realizar esta venta?',
      'Sí, vender',
      'Cancelar',
      () => {
        // ✔️ CONFIRMADO
        this.realizarVenta();
      },
      () => {
        // ❌ CANCELADO
        // no hacemos nada
      },
      {
        titleColor: '#ffffff',
        messageColor: '#ffffff',
        backgroundColor: '#1e1e2f',
        okButtonBackground: '#28a745',
        cancelButtonBackground: '#dc3545',
        okButtonColor: '#ffffff',
        cancelButtonColor: '#ffffff',
        borderRadius: '12px',
        width: '360px'
      }
    );
  }
  realizarVenta(): void {
    Notiflix.Loading.standard('Procesando venta...');
    setTimeout(() => {
      Notiflix.Loading.remove();

      Notiflix.Notify.success('Venta realizada con éxito');


      this.clearCart();

      this.cliente = {
        nombre: '',
        celular: '',
        rol: 'cliente'
      };

      this.formGroup.get('searchControl')?.setValue('');
    }, 800);
  }


  getAllProducts(): void {
    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc')
      .subscribe({
        next: (data: any) => {
          this.allProducts = data.items || [];
          this.showDefaultProducts();
        }
      });
  }

  /* =========================
     🔍 FILTRO POS REAL
     ========================= */

  applyFilter(value: any): void {
    const raw = this.formGroup.get('searchControl')!.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

    // 🔹 SI NO hay texto → mostrar pocos productos por defecto
    if (!tokens.length) {
      this.products = filtered.slice(0, 6);
      return;
    }

    // 🔹 MISMO MOTOR QUE INVENTARIO
    filtered = filtered
      .map(p => {
        const normDesc = this.normalizeText(p.descripcion ?? '');
        const normCode = this.normalizeText(p.codigo ?? '');

        const matchesAll = tokens.every((t: any) =>
          this.textContainsToken(normDesc, t) ||
          this.textContainsToken(normCode, t)
        );

        const score = matchesAll
          ? this.scoreMatch(normDesc, normCode, tokens)
          : -1;

        return { p, score };
      })
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.p);

    // 🔹 POS: solo pocos resultados
    this.products = filtered.slice(0, 6);
  }

  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(text: string): string[] {
    const norm = this.normalizeText(text);
    return norm.match(/[a-z0-9]+/gi)?.map(t => this.normalizeText(t)) ?? [];
  }

  private stem(token: string): string {
    return token.replace(/(es|s)$/i, '');
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private textContainsToken(text: string, token: string): boolean {
    if (!text || !token) return false;
    const t = this.escapeRegExp(token);
    const stemmed = this.escapeRegExp(this.stem(token));

    return (
      text.includes(token) ||
      (stemmed && text.includes(stemmed)) ||
      new RegExp(`\\b${t}`, 'i').test(text) ||
      new RegExp(`${t}\\b`, 'i').test(text)
    );
  }

  private scoreMatch(normDesc: string, normCode: string, tokens: string[]): number {
    let score = 0;

    for (const t of tokens) {
      const inCode = this.textContainsToken(normCode, t);
      const inDesc = this.textContainsToken(normDesc, t);

      if (inDesc) score += 6;   // prioridad descripción
      if (inCode) score += 3;

      if (normDesc.startsWith(t)) score += 4;
    }

    return score;
  }

  private showDefaultProducts(): void {
    this.products = this.allProducts.slice(0, this.MAX_RESULTS);
  }

  /* =========================
     🛒 CARRITO
     ========================= */

  addProductToCart(product: any): void {
    const existing = this.cartItems.find(
      p => p.descripcion === product.descripcion
    );

    if (existing) {
      existing.cantidad++;
    } else {
      this.cartItems.push({
        descripcion: product.descripcion,
        pvp: product.pvp,
        cantidad: 1
      });
    }
  }

  removeItem(index: number): void {
    this.cartItems.splice(index, 1);
  }

  clearCart(): void {
    this.cartItems = [];
  }

  recalculate(): void {}

  getTotal(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.pvp * item.cantidad,
      0
    );
  }
}
