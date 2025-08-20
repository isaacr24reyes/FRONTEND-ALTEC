import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ProductService } from '../../services/warehouse.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Notiflix from "notiflix";
declare var bootstrap: any;

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  products: any[] = [];
  totalCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  private pageSize: number = 5;
  selectedProduct: any;
  isFirstLoad: boolean = true;
  isLoading: boolean = true;
  tipoInventario: string = 'estudiante';
  tipoCategoria: string = 'todo';

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: ['']
    });
    this.getAllProducts();
    this.formGroup.get('searchControl')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilter();
      });
  }

  getAllProducts(): void {
    if (this.isFirstLoad) {
      Notiflix.Loading.standard('Cargando productos...');
      this.isLoading = true;
    }

    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc').subscribe({
      next: (data: any) => {
        this.allProducts = (data.items || []).map((p: any) => ({
          ...p,
          _normDesc: this.normalizeText(`${p.descripcion ?? ''}`),
          _normCode: this.normalizeText(`${p.codigo ?? ''}`)
        }));
        this.applyFilter();

        if (this.isFirstLoad) {
          Notiflix.Loading.remove();
          this.isLoading = false;
          this.isFirstLoad = false;
        }
      },
      error: (error: any) => {
        console.error('Error al obtener los productos', error);
        if (this.isFirstLoad) {
          Notiflix.Loading.remove();
          this.isLoading = false;
          this.isFirstLoad = false;
        }
      }
    });
  }

  generarInventario() {
    console.log("Generando inventario...");
  }

  applyFilter(): void {
    const raw = this.formGroup.get('searchControl')!.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

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

    this.totalCount = filtered.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(startIndex, startIndex + this.pageSize);
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

  openProductModal(product: any): void {
    this.selectedProduct = product;
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
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

  onSubmit() {}

  descargarPDF() {
    console.log("Descargando PDF para:", this.tipoInventario);
  }

  descargarExcel() {
    console.log("Descargando Excel para:", this.tipoInventario);
  }
}
