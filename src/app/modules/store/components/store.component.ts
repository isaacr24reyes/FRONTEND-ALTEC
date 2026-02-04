import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { NgForOf, CurrencyPipe, NgIf } from '@angular/common';
import { ProductService } from "../../warehouse/services/warehouse.service";
import { LoaderService } from "../../../shared/services/LoaderService";
import { LoaderComponent } from "../../../shared/components/LoaderComponent";
import Notiflix from "notiflix";
import { CartService } from "../../../shared/services/CartService";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'app-store',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    ReactiveFormsModule,
    CurrencyPipe,
    NgIf,
    LoaderComponent
  ],
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss'
})
export class StoreComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('neuronCanvas') neuronCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('storeHero') storeHero!: ElementRef<HTMLDivElement>;
  @ViewChild('resultsSection') resultsSection!: ElementRef<HTMLElement>;

  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  products: any[] = [];
  totalCount = 0;
  currentPage = 1;
  totalPages = 0;
  pageSize = 12;
  searchTerm = '';
  selectedProduct: any = null;
  selectedValue: string = '';

  // Control de vista compacta
  isSearching: boolean = false;

  // Neuronas
  private animationId: number | null = null;
  private neurons: Neuron[] = [];
  private mouse = { x: 0, y: 0 };

  resistorValues: string[] = [
    '1Ω',
    '8.2Ω',
    '10Ω',
    '20Ω',
    '22Ω',
    '27Ω',
    '47Ω',
    '56Ω',
    '62Ω',
    '68Ω',
    '75Ω',
    '82Ω',
    '100Ω',
    '110Ω',
    '120Ω',
    '200Ω',
    '220Ω',
    '240Ω',
    '270Ω',
    '300Ω',
    '330Ω',
    '360Ω',
    '390Ω',
    '470Ω',
    '510Ω',
    '560Ω',
    '680Ω',
    '820Ω',

    // kΩ (Kiloohmios)
    '1kΩ',
    '1.2kΩ',
    '1.8kΩ',
    '2kΩ',
    '2.2kΩ',
    '2.7kΩ',
    '3.3kΩ',
    '3.9kΩ',
    '4.7kΩ',
    '5.1kΩ',
    '5.6kΩ',
    '6.2kΩ',
    '6.8kΩ',
    '8.2kΩ',
    '10kΩ',
    '12kΩ',
    '15kΩ',
    '16kΩ',
    '20kΩ',
    '22kΩ',
    '27kΩ',
    '39kΩ',
    '47kΩ',
    '56kΩ',
    '68kΩ',
    '82kΩ',
    '100kΩ',
    '120kΩ',
    '150kΩ',
    '220kΩ',
    '270kΩ',
    '330kΩ',
    '470kΩ',
    '560kΩ',
    '750kΩ',
    '820kΩ',

    // MΩ (Megaohmios)
    '1MΩ',
    '2.2MΩ',
    '10MΩ'
  ];

  categories = [
    'Audio y video',
    'Baquelitas',
    'Componentes Electrónicos',
    'Compuertas e Integrados',
    'Electricidad',
    'Fuentes',
    'Herramientas',
    'Microcontroladores y Arduinos',
    'Modulos y Sensores',
    'Motores',
    'Parlantes',
    'Pilas y Baterias',
    'Plugs y Conectores',
    'Protoboards',
    'Proyectos Y kits',
    'Redes y Comunicación',
    'Transformadores',
    'Otros'
  ];
  selectedCategories: string[] = [];
  isDistribuidor: boolean = false;
  distribuidorName: string = '';
  public clienteName: string = '';
  public isCliente: boolean = false;
  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder,
    private loaderService: LoaderService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.isDistribuidor = sessionStorage.getItem('isDistribuidor') === 'true';

    const userInfoString = sessionStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const parsedUser = JSON.parse(userInfoString);
        const role = parsedUser?.role;

        if (this.isDistribuidor) {
          this.distribuidorName = parsedUser.name ?? '';
        }

        // Detectar si es Cliente
        if (role === 'Cliente') {
          this.isCliente = true;
          this.clienteName = parsedUser.name ?? '';
        }

      } catch (err) {
        console.error('Error al parsear userInfo:', err);
      }
    }

    Notiflix.Notify.init({
      position: 'left-top',
      timeout: 1000,
      clickToClose: true
    });

    this.formGroup = this.fb.group({
      searchTerm: ['']
    });

    this.formGroup.get('searchTerm')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilter();
      });

    this.loaderService.start();
    this.loadProducts();
  }


  addToCart(product: any): void {
    const descripcion = product.descripcion?.toLowerCase() || '';

    // Modal para resistencias
    if (descripcion.includes('resistencia') && product.descripcion.includes('1/4 W')) {
      this.selectedProduct = product;
      this.selectedValue = '';
      const modal = new (window as any).bootstrap.Modal(document.getElementById('resistorModal'));
      modal.show();
      return;
    }

    // Modal para LEDs
    if (descripcion.includes('led') && descripcion.includes('diodo')) {
      this.selectedProduct = product;
      this.selectedValue = '';
      const modal = new (window as any).bootstrap.Modal(document.getElementById('ledModal')); // 👈 ESTE CAMBIO
      modal.show();
      return;
    }

    this.cartService.addToCart(product);
    Notiflix.Notify.success(`Agregado ${product.cantidad} x ${product.descripcion} al carrito`);
  }


  confirmAddResistor(): void {
    if (!this.selectedValue) {
      Notiflix.Notify.warning('Selecciona un valor de resistencia');
      return;
    }

    const newProduct = {
      ...this.selectedProduct,
      descripcion: `${this.selectedProduct.descripcion} - ${this.selectedValue}`
    };

    this.cartService.addToCart(newProduct);
    Notiflix.Notify.success(`Agregado ${newProduct.cantidad} x ${newProduct.descripcion} al carrito`);

    const modalElement = document.getElementById('resistorModal');
    const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
    modalInstance?.hide();

    modalInstance?.hide(); // solo si existe
  }


  loadProducts(): void {
    const isDistribuidor = sessionStorage.getItem('isDistribuidor') === 'true';

    const loadObservable = isDistribuidor
      ? this.productService.getProductsImport()
      : this.productService.getProductsClient(1, 1000, '');

    loadObservable.subscribe({
      next: (data: any) => {
        const items = Array.isArray(data) ? data : data?.items ?? [];

        this.allProducts = items.map((p: any) => ({
          ...p,
          cantidad: 1,
          _normDesc: this.normalizeText(`${p.descripcion ?? ''}`),
          _normCode: this.normalizeText(`${p.codigo ?? ''}`)
        }));

        this.applyFilter();
        this.loaderService.finish();
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.loaderService.finish();
      }
    });
  }

  confirmAddLed(): void {
    if (!this.selectedProduct || !this.selectedValue) return;

    const cloned = { ...this.selectedProduct };
    cloned.descripcion += ` - ${this.selectedValue}`;

    this.cartService.addToCart(cloned);
    Notiflix.Notify.success(`Agregado ${cloned.cantidad} x ${cloned.descripcion} al carrito`);

    const modalElement = document.getElementById('ledModal');
    const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
    modalInstance?.hide();
  }


  applyFilter(): void {
    const raw = this.formGroup.get('searchTerm')!.value || '';
    const tokens = this.tokenize(raw);
    let filtered = this.allProducts;

    // Activar modo búsqueda si hay términos o categorías seleccionadas
    this.isSearching = tokens.length > 0 || this.selectedCategories.length > 0;

    if (tokens.length) {
      filtered = this.allProducts
        .map(p => {
          const normDesc = p._normDesc as string;
          const normCode = p._normCode as string;

          const matchesAll = tokens.every(t =>
            this.textContainsToken(normDesc, t) || this.textContainsToken(normCode, t)
          );

          const score = matchesAll ? this.scoreMatch(normDesc, normCode, tokens) : -1;
          return { p, score };
        })
        .filter(x => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.p);
    }

    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(p => this.selectedCategories.includes(p.categoria));
    }
    this.totalCount = filtered.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(startIndex, startIndex + this.pageSize);
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

      if (inCode) score += 10;
      if (inDesc) score += 4;

      const tEsc = this.escapeRegExp(t);
      if (new RegExp(`\\b${tEsc}\\b`).test(normDesc)) score += 2;
      if (new RegExp(`\\b${tEsc}\\b`).test(normCode)) score += 4;

      if (normDesc.startsWith(t)) score += 2;
      if (normCode.startsWith(t)) score += 3;
    }
    const allInDesc = tokens.every(t => this.textContainsToken(normDesc, t));
    const allInCode = tokens.every(t => this.textContainsToken(normCode, t));
    if (allInDesc) score += 5;
    if (allInCode) score += 8;

    return score;
  }
  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilter();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilter();
    }
  }

  onSubmit() {
    this.applyFilter();
  }
  onCategoryChange(event: any): void {
    const value = event.target.value;
    const checked = event.target.checked;

    if (checked) {
      if (!this.selectedCategories.includes(value)) {
        this.selectedCategories.push(value);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(cat => cat !== value);
    }
    this.formGroup.get('searchTerm')?.setValue('');
    this.currentPage = 1;
    this.applyFilter();
  }
  clearFilters(): void {
    this.formGroup.get('searchTerm')?.setValue('');
    this.selectedCategories = [];
    this.currentPage = 1;
    this.applyFilter();
  }

  incrementQuantity(product: any): void {
    if (!product.cantidad) {
      product.cantidad = 1;
    }
    product.cantidad++;
  }

  decrementQuantity(product: any): void {
    if (!product.cantidad) {
      product.cantidad = 1;
    } else if (product.cantidad > 1) {
      product.cantidad--;
    }
  }

  ngAfterViewInit(): void {
    this.initNeuronNetwork();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initNeuronNetwork(): void {
    const canvas = this.neuronCanvas?.nativeElement;
    const hero = this.storeHero?.nativeElement;

    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Crear neuronas (menos en móvil para mejor performance)
    const isMobile = window.innerWidth < 768;
    const neuronCount = isMobile ? 30 : 90; // 3 veces menos en móvil
    for (let i = 0; i < neuronCount; i++) {
      this.neurons.push(new Neuron(canvas.width, canvas.height));
    }

    // Evento de mouse
    hero.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    // Animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Actualizar y dibujar neuronas
      this.neurons.forEach(neuron => {
        neuron.update(this.mouse);
        neuron.draw(ctx);
      });

      // Dibujar conexiones entre neuronas cercanas
      this.drawConnections(ctx);

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  private drawConnections(ctx: CanvasRenderingContext2D): void {
    const maxDistance = 120;

    for (let i = 0; i < this.neurons.length; i++) {
      for (let j = i + 1; j < this.neurons.length; j++) {
        const dx = this.neurons[i].x - this.neurons[j].x;
        const dy = this.neurons[i].y - this.neurons[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.4;
          // Conexiones en azul brillante futurista
          ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(this.neurons[i].x, this.neurons[i].y);
          ctx.lineTo(this.neurons[j].x, this.neurons[j].y);
          ctx.stroke();
        }
      }
    }
  }
}

// 🧠 Clase Neuron para el efecto de red neuronal
class Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseX: number;
  baseY: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.baseX = this.x;
    this.baseY = this.y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
  }

  update(mouse: { x: number; y: number }): void {
    // Movimiento base
    this.x += this.vx;
    this.y += this.vy;

    // Atracción al mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 150;

    if (distance < maxDistance) {
      const force = (1 - distance / maxDistance) * 2;
      this.x += dx * force * 0.02;
      this.y += dy * force * 0.02;
    }

    // Retorno suave a la posición base
    this.x += (this.baseX - this.x) * 0.02;
    this.y += (this.baseY - this.y) * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Color azul brillante futurista
    ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect azul futurista
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
