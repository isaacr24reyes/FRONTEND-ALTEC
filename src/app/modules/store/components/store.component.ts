import { Component, OnInit } from '@angular/core';
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
export class StoreComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  products: any[] = [];
  totalCount = 0;
  currentPage = 1;
  totalPages = 0;
  pageSize = 12;
  searchTerm = '';
  categories = [
    'Audio y video',
    'Baquelitas',
    'Componentes Electrónicos',
    'Compuertas e Integrados',
    'Fuentes',
    'Herramientas',
    'Microcontroladores y Arduinos',
    'Modulos y Sensores',
    'Motores',
    'Parlantes',
    'Pilas y Baterias',
    'Protoboards',
    'Proyectos Y kits',
    'Redes y Comunicación',
    'Transformadores'
  ];
  selectedCategories: string[] = [];


  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder,
    private loaderService: LoaderService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    Notiflix.Notify.init({
      position: 'left-top',
      timeout: 1000,
      clickToClose: true
    });

    this.formGroup = this.fb.group({
      searchTerm: ['']
    });

    // Suscripción con debounce para búsquedas reactivas
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
    this.cartService.addToCart(product);
    Notiflix.Notify.success(`Agregado ${product.cantidad} x ${product.descripcion} al carrito`);
  }

  loadProducts(): void {
    this.productService.getProductsClient(1, 1000, '') // Pedimos todos (1-1000)
      .subscribe({
        next: (data: any) => {
          this.allProducts = (data?.items ?? []).map((p: any) => ({
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
  applyFilter(): void {
    const raw = this.formGroup.get('searchTerm')!.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

    // FILTRO POR TEXTO (como ya lo tenías)
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

    this.currentPage = 1;
    this.applyFilter();
  }
  clearFilters(): void {
    this.formGroup.get('searchTerm')?.setValue('');
    this.selectedCategories = [];
    this.currentPage = 1;
    this.applyFilter();
  }

}
