import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../../warehouse/services/warehouse.service';
import { SalesService, SaleDto } from '../../../services/sales.service';
import { forkJoin } from 'rxjs';
import Notiflix from 'notiflix';

interface CartItem {
  id?: string;
  descripcion: string;
  pvp: number;
  cantidad: number;
  subtotal?: number;
}

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
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

  // 💳 Métodos de pago
  paymentMethods: PaymentMethod[] = [
    { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
    { id: 'transferencia', label: 'Transferencia', icon: 'bank' }
  ];
  selectedPaymentMethod: string = 'efectivo';

  // 🔢 Cálculos
  subtotal: number = 0;
  taxRate: number = 0.00; // IVA 15% ya incluido en el precio (no se suma)
  taxAmount: number = 0;
  total: number = 0;

  // 💵 Calculadora de Cambio (para Efectivo)
  montoRecibido: number = 0;
  cambio: number = 0;
  showCalculadoraCambio: boolean = false;

  // 📱 UI State
  showCart: boolean = true;
  cartCollapsed: boolean = false;

  private readonly MAX_RESULTS = 8;
  private readonly TAX_RATE = 0.00; // IVA 15% ya incluido en precio

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private salesService: SalesService
  ) { }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: ['', [Validators.maxLength(100)]],
      clientName: ['', [Validators.minLength(2)]],
      clientDocument: ['', [Validators.pattern(/^[0-9]{10,13}$/)]],
      clientPhone: ['', [Validators.pattern(/^[0-9]{7,15}$/)]]
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
    // 📋 Validaciones
    if (this.cartItems.length === 0) {
      Notiflix.Notify.warning('El carrito está vacío. Agrega productos antes de confirmar.');
      return;
    }

    // 💵 Si es EFECTIVO, mostrar calculadora de cambio
    if (this.selectedPaymentMethod === 'efectivo') {
      this.showCalculadoraCambio = true;
      this.montoRecibido = 0;
      this.cambio = 0;
      return;
    }

    // 💳 Si es otro método de pago, continuar normal
    const clientName = this.formGroup.get('clientName')?.value || 'Cliente General';

    Notiflix.Confirm.show(
      'Confirmar Venta',
      `¿Completar venta a <strong>${clientName}</strong> por <strong>$${this.total.toFixed(2)}</strong>?`,
      'Sí, Vender',
      'Cancelar',
      () => {
        this.realizarVenta();
      },
      () => {
        // ❌ CANCELADO
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
        width: '380px'
      }
    );
  }

  realizarVenta(): void {
    if (this.cartItems.length === 0) {
      Notiflix.Notify.warning('El carrito está vacío');
      return;
    }

    Notiflix.Loading.standard('Procesando venta...');

    const invoiceNumber = `INV-${Date.now()}`;
    const saleDate = new Date().toISOString();
    const paymentMethod = this.selectedPaymentMethod;

    // TODO: Ajustar employeeID real cuando exista autenticación
    const employeeID = null; // Enviar null si no hay ninguno.

    // Crear un arreglo de peticiones concurrentes para cada item del carrito
    const salesObservables = this.cartItems.map(item => {
      const product = this.allProducts.find(p => p.id === item.id);
      const precioImportacion = product?.precioImportacion || 0; // Obtener precioImportacion del producto

      const subtotalItem = item.pvp * item.cantidad;
      const taxItem = subtotalItem * this.TAX_RATE;

      // Calcular ganancia total (PVP - precioImportacion) * cantidad
      const profit = (item.pvp - precioImportacion) * item.cantidad;

      const sale: SaleDto = {
        invoiceNumber: invoiceNumber,
        employeeID: employeeID,
        productID: item.id || '', // El backend espera un GUID como string.
        saleDate: saleDate,
        profit: profit,
        quantity: item.cantidad,
        unitPrice: item.pvp,
        taxAmount: taxItem,
        totalAmount: subtotalItem + taxItem,
        paymentMethod: paymentMethod,
        status: 'Completed'
      };

      return this.salesService.createSale(sale);
    });

    forkJoin(salesObservables).subscribe({
      next: (results) => {
        Notiflix.Loading.remove();
        Notiflix.Notify.success('✓ Venta realizada con éxito');
        this.limpiarVenta();
      },
      error: (err) => {
        Notiflix.Loading.remove();
        console.error('Error procesando la venta:', err);
        Notiflix.Notify.failure('Error al procesar la venta');
      }
    });
  }

  limpiarVenta(): void {
    this.cartItems = [];
    this.formGroup.reset();
    this.selectedPaymentMethod = 'efectivo';
    this.recalculate();
    this.applyFilter('');
  }

  getAllProducts(): void {
    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc')
      .subscribe({
        next: (data: any) => {
          this.allProducts = data.items || [];
          this.showDefaultProducts();
        },
        error: (err) => {
          console.error('Error loading products:', err);
          Notiflix.Notify.failure('Error al cargar productos');
        }
      });
  }

  /* =========================
     🔍 FILTRO INTELIGENTE
     ========================= */

  applyFilter(value: any): void {
    const raw = this.formGroup.get('searchControl')!.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

    if (!tokens.length) {
      this.showDefaultProducts();
      return;
    }

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

    this.products = filtered.slice(0, this.MAX_RESULTS);
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

      if (inDesc) score += 6;
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
        id: product.idProducto?.toString() || product.id?.toString() || '0',
        descripcion: product.descripcion,
        pvp: product.pvp || 0,
        cantidad: 1
      });
    }

    this.recalculate();
    Notiflix.Notify.success('Producto agregado al carrito', { position: 'right-bottom', timeout: 1500 });
  }

  incrementQuantity(index: number): void {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems[index].cantidad++;
      this.recalculate();
    }
  }

  decrementQuantity(index: number): void {
    if (index >= 0 && index < this.cartItems.length) {
      if (this.cartItems[index].cantidad > 1) {
        this.cartItems[index].cantidad--;
      } else {
        this.removeItem(index);
      }
      this.recalculate();
    }
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems.splice(index, 1);
      this.recalculate();
      Notiflix.Notify.info('Producto removido', { position: 'right-bottom', timeout: 1200 });
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.recalculate();
  }

  recalculate(): void {
    this.subtotal = this.cartItems.reduce(
      (sum, item) => sum + (item.pvp * item.cantidad),
      0
    );

    this.taxAmount = this.subtotal * this.TAX_RATE;
    this.total = this.subtotal + this.taxAmount;

    // Actualizar subtotal en items
    this.cartItems.forEach(item => {
      item.subtotal = item.pvp * item.cantidad;
    });
  }

  getTotal(): number {
    return this.total;
  }

  toggleCart(): void {
    this.cartCollapsed = !this.cartCollapsed;
  }

  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod = methodId;

    // 💳 Si cambia a otro método que NO sea efectivo, cerrar calculadora
    if (methodId !== 'efectivo' && this.showCalculadoraCambio) {
      this.cerrarCalculadora();
    }
  }

  // 💵 CALCULADORA DE CAMBIO
  calcularCambio(): void {
    this.cambio = this.montoRecibido - this.total;
  }

  limpiarMonto(): void {
    this.montoRecibido = 0;
    this.cambio = -this.total;
  }

  cerrarCalculadora(): void {
    this.showCalculadoraCambio = false;
    this.montoRecibido = 0;
    this.cambio = 0;
  }

  procesarCobroEfectivo(): void {
    // Validar que el monto recibido sea suficiente
    if (this.montoRecibido < this.total) {
      Notiflix.Notify.warning('El monto recibido es menor al total. Verifica el pago.');
      return;
    }

    // Calcular cambio final
    this.calcularCambio();

    // Cerrar calculadora
    this.showCalculadoraCambio = false;

    // Mostrar confirmación con el cambio
    const clientName = this.formGroup.get('clientName')?.value || 'Cliente General';

    Notiflix.Confirm.show(
      '💵 Confirmar Cobro en Efectivo',
      `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Cliente:</strong> ${clientName}</p>
          <p><strong>Total a pagar:</strong> $${this.total.toFixed(2)}</p>
          <p><strong>Recibido:</strong> $${this.montoRecibido.toFixed(2)}</p>
          <p style="color: #00b894; font-size: 1.2rem; font-weight: bold;">
            <strong>Cambio:</strong> $${this.cambio.toFixed(2)}
          </p>
        </div>
      `,
      '✅ Guardar en Caja',
      'Cancelar',
      () => {
        this.realizarVenta();
      },
      () => {
        // ❌ CANCELADO - Volver a mostrar calculadora
        this.showCalculadoraCambio = true;
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
        width: '420px'
      }
    );
  }

  // Método para botones rápidos de monto
  agregarMonto(monto: number): void {
    this.montoRecibido += monto;
    this.calcularCambio();
  }

  setMontoExacto(): void {
    this.montoRecibido = this.total;
    this.calcularCambio();
  }

  // 🔍 Limpiar búsqueda al hacer focus
  onSearchFocus(): void {
    const searchControl = this.formGroup.get('searchControl');
    if (searchControl && searchControl.value) {
      searchControl.setValue('');
    }
  }
}
