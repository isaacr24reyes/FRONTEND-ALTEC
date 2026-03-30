import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../../warehouse/services/warehouse.service';
import { SalesService, SaleDto } from '../../../services/sales.service';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import Notiflix from 'notiflix';

interface CartItem {
  id?: string;
  descripcion: string;
  pvp: number;
  priceType: string;
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

  // ⚡ Resistencias
  resistorValues: string[] = [
    '1Ω', '8.2Ω', '10Ω', '20Ω', '22Ω', '27Ω', '47Ω', '56Ω', '62Ω', '68Ω', '75Ω', '82Ω',
    '100Ω', '110Ω', '120Ω', '200Ω', '220Ω', '240Ω', '270Ω', '300Ω', '330Ω', '360Ω',
    '390Ω', '470Ω', '510Ω', '560Ω', '680Ω', '820Ω',
    '1kΩ', '1.2kΩ', '1.8kΩ', '2kΩ', '2.2kΩ', '2.7kΩ', '3.3kΩ', '3.9kΩ', '4.7kΩ',
    '5.1kΩ', '5.6kΩ', '6.2kΩ', '6.8kΩ', '8.2kΩ', '10kΩ', '12kΩ', '15kΩ', '16kΩ',
    '20kΩ', '22kΩ', '27kΩ', '39kΩ', '47kΩ', '56kΩ', '68kΩ', '82kΩ', '100kΩ',
    '120kΩ', '150kΩ', '220kΩ', '270kΩ', '330kΩ', '470kΩ', '560kΩ', '750kΩ', '820kΩ',
    '1MΩ', '2.2MΩ', '10MΩ'
  ];
  resistorHalfWattValues: string[] = [
    '12Ω', '15Ω', '18Ω', '30Ω', '33Ω', '39Ω', '56Ω', '150Ω',
    '1.5kΩ', '10kΩ', '33kΩ', '100kΩ', '150kΩ', '680kΩ'
  ];
  showResistorModal = false;
  resistorModalTitle = '';
  activeResistorValues: string[] = [];
  selectedResistorValue = '';
  pendingResistorProduct: any = null;
  pendingResistorPriceType = 'pvp';

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

  private readonly MAX_RESULTS = 10;
  private readonly TAX_RATE = 0.00; // IVA 15% ya incluido en precio

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private salesService: SalesService,
    private http: HttpClient
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
    const saleDate = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); // UTC-5 Ecuador
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

    // Capturar items antes de limpiar el carrito
    const itemsVendidos = this.cartItems.map(i => ({ id: i.id!, cantidad: i.cantidad }));

    forkJoin(salesObservables).subscribe({
      next: () => {
        // Descontar stock de cada producto vendido
        const stockObservables = itemsVendidos
          .filter(i => i.id)
          .map(i => this.productService.reducirStock(i.id, i.cantidad));

        forkJoin(stockObservables).subscribe({
          next: () => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('✓ Venta realizada con éxito');
            this.limpiarVenta();
            this.getAllProducts(); // refresca stock en tiempo real
          },
          error: () => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('✓ Venta guardada, pero hubo un error al actualizar el stock.');
            this.limpiarVenta();
            this.getAllProducts(); // refresca de todas formas para mostrar estado real
          }
        });
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
          // Preserva el filtro activo para que el stock se actualice
          // en la vista que el usuario ya tiene abierta
          const currentSearch = this.formGroup.get('searchControl')?.value || '';
          if (currentSearch.trim()) {
            this.applyFilter(currentSearch);
          } else {
            this.showDefaultProducts();
          }
        },
        error: (err) => {
          console.error('Error loading products:', err);
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

  addProductToCart(product: any, priceType: string = 'pvp'): void {
    const desc = (product.descripcion || '').toLowerCase();

    // Interceptar resistencias 1/4W para pedir el valor
    if (desc.includes('resistencia') && desc.includes('1/4')) {
      this.pendingResistorProduct = product;
      this.pendingResistorPriceType = priceType;
      this.activeResistorValues = this.resistorValues;
      this.resistorModalTitle = 'Resistencia ¼ Watt';
      this.selectedResistorValue = '';
      this.showResistorModal = true;
      return;
    }

    // Interceptar resistencias 1/2W para pedir el valor
    if (desc.includes('resistencia') && desc.includes('1/2')) {
      this.pendingResistorProduct = product;
      this.pendingResistorPriceType = priceType;
      this.activeResistorValues = this.resistorHalfWattValues;
      this.resistorModalTitle = 'Resistencia ½ Watt';
      this.selectedResistorValue = '';
      this.showResistorModal = true;
      return;
    }

    this.doAddToCart(product, priceType);
  }

  /** Confirmación desde el modal de resistencias */
  confirmResistorSales(): void {
    if (!this.selectedResistorValue) {
      Notiflix.Notify.warning('Selecciona el valor de la resistencia');
      return;
    }
    const product = {
      ...this.pendingResistorProduct,
      descripcion: `${this.pendingResistorProduct.descripcion} - ${this.selectedResistorValue}`
    };
    this.showResistorModal = false;
    this.doAddToCart(product, this.pendingResistorPriceType);
  }

  /** Agrega directamente al carrito (sin verificación de resistencias) */
  private doAddToCart(product: any, priceType: string): void {
    const precio = priceType === 'mayorista'
      ? (product.precioMayorista || product.pvp || 0)
      : (product.pvp || 0);

    const productId = product.idProducto?.toString() || product.id?.toString() || '0';
    const desc = (product.descripcion || '').toLowerCase();
    const isResistor = desc.includes('resistencia');

    // Resistencias se diferencian por descripción completa (incluye el valor)
    const existing = isResistor
      ? this.cartItems.find(p => p.id === productId && p.descripcion === product.descripcion && p.priceType === priceType)
      : this.cartItems.find(p => p.id === productId && p.priceType === priceType);

    if (existing) {
      existing.cantidad++;
    } else {
      this.cartItems.push({
        id: productId,
        descripcion: product.descripcion,
        pvp: precio,
        priceType: priceType,
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

  /** Solo permite teclas numéricas, borrar, flechas y tabulador */
  onQtyKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  /** Actualiza la cantidad mientras el usuario escribe */
  onQtyInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val >= 1) {
      this.cartItems[index].cantidad = val;
      this.recalculate();
    }
  }

  /** Al perder el foco: si queda vacío o 0, fuerza 1 */
  onQtyBlur(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
      this.cartItems[index].cantidad = 1;
      input.value = '1';
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

  /* =========================
     📋 CARGAR COTIZACIÓN
     ========================= */

  numeroCotizacion: string = '';
  buscandoCotizacion: boolean = false;
  cotizacionCargada: any[] | null = null;

  buscarCotizacion(): void {
    const numero = this.numeroCotizacion.trim();
    if (!numero) {
      Notiflix.Notify.warning('Ingresa un número de cotización.');
      return;
    }

    this.buscandoCotizacion = true;
    this.cotizacionCargada = null;

    this.http.get<any[]>(`${environment.apiALTEC}/api/cotizaciones/${numero}`).subscribe({
      next: (items) => {
        this.buscandoCotizacion = false;
        if (!items || items.length === 0) {
          Notiflix.Notify.warning('No se encontró la cotización.');
          return;
        }
        this.cotizacionCargada = items;
      },
      error: () => {
        this.buscandoCotizacion = false;
        Notiflix.Notify.failure('No se encontró la cotización o ocurrió un error.');
      }
    });
  }

  getProductName(productId: string): string {
    const product = this.allProducts.find(p => p.id === productId);
    return product ? product.descripcion : productId;
  }

  getPrecioParaCotizacion(item: any): number {
    const product = this.allProducts.find(p => p.id === item.productId);
    if (!product) return item.unitPrice ?? 0;
    const esMayorista = (item.priceType ?? '').toLowerCase() === 'mayorista';
    return esMayorista && product.precioMayorista > 0
      ? product.precioMayorista
      : product.pvp;
  }

  cargarCotizacionAlCarrito(): void {
    if (!this.cotizacionCargada) return;

    let cargados = 0;
    for (const item of this.cotizacionCargada) {
      const product = this.allProducts.find(p => p.id === item.productId);
      if (!product) continue;

      const esMayorista = (item.priceType ?? '').toLowerCase() === 'mayorista';
      const precio = esMayorista && product.precioMayorista > 0
        ? product.precioMayorista
        : product.pvp;

      const existing = this.cartItems.find(c => c.id === product.id && c.priceType === (esMayorista ? 'mayorista' : 'pvp'));
      if (existing) {
        existing.cantidad += item.quantity;
      } else {
        this.cartItems.push({
          id: product.id,
          descripcion: product.descripcion,
          pvp: precio,
          priceType: item.priceType || 'pvp',
          cantidad: item.quantity
        });
      }
      cargados++;
    }

    this.recalculate();

    if (cargados > 0) {
      Notiflix.Notify.success(`${cargados} producto(s) cargado(s) al carrito.`);
      this.cotizacionCargada = null;
      this.numeroCotizacion = '';
    } else {
      Notiflix.Notify.warning('No se encontraron productos de la cotización en el inventario.');
    }
  }
}
