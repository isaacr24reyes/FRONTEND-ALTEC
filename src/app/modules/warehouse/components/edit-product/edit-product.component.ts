import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { ProductService } from "../../services/warehouse.service";
import { CommonModule } from '@angular/common';
import Notiflix from 'notiflix';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss'
})
export class EditProductComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  products: any[] = [];
  selectedProduct: any
  currentPage = 1;
  pageSize = 25;
  totalCount: number = 0;
  totalPages: number = 0;

  // Loading inicial
  isFirstLoad: boolean = true;
  isLoading: boolean = true;

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: ['']
    });
    this.getProducts();
    this.formGroup.get('searchControl')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.getProducts();
      });
  }
  getProducts(): void {
    if (!this.allProducts.length) {
      if (this.isFirstLoad) {
        Notiflix.Loading.standard('Cargando productos...');
        this.isLoading = true;
      }
      this.productService.getProducts(1, 1000, '').subscribe({
        next: (response: any) => {
          const items = response?.items ?? [];
          this.allProducts = items.map((p: any) => ({
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
        error: (error) => {
          console.error('Error al obtener productos:', error);
          if (this.isFirstLoad) {
            Notiflix.Loading.remove();
            this.isLoading = false;
            this.isFirstLoad = false;
          }
        }
      });
    } else {
      // Ya tengo allProducts: solo filtro y pagino
      this.applyFilter();
    }
  }

  /** ---------- Filtro con tokens en cualquier orden + ranking ---------- */
  applyFilter(): void {
    const raw = this.formGroup.get('searchControl')?.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

    if (tokens.length) {
      filtered = this.allProducts
        .map(p => {
          const normDesc = p._normDesc as string;
          const normCode = p._normCode as string;

          // AND: todos los tokens deben aparecer en desc o código (cualquier orden)
          const matchesAll = tokens.every(t =>
            this.textContainsToken(normDesc, t) || this.textContainsToken(normCode, t)
          );

          const score = matchesAll ? this.scoreMatch(normDesc, normCode, tokens) : -1;
          return { p, score };
        })
        .filter(x => x.score >= 0)
        .sort((a, b) => b.score - a.score)   // ordenar por relevancia
        .map(x => x.p);
    }

    this.filteredProducts = filtered;
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

  openModal(producto: any): void {
    this.selectedProduct = { ...producto };
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  guardarEdicion(): void {
    if (!this.selectedProduct) return;

    this.productService.updateProduct(this.selectedProduct.id, this.selectedProduct).subscribe(
      (updatedProduct: any) => {
        const idxAll = this.allProducts.findIndex(p => p.id === updatedProduct.id);
        if (idxAll !== -1) {
          this.allProducts[idxAll] = {
            ...updatedProduct,
            _normDesc: this.normalizeText(`${updatedProduct.descripcion ?? ''}`),
            _normCode: this.normalizeText(`${updatedProduct.codigo ?? ''}`)
          };
        }
        this.applyFilter();

        this.closeModal();

        Notiflix.Report.success(
          'Producto actualizado',
          'El producto ha sido actualizado correctamente.',
          'Aceptar'
        );
      },
      (error: any) => {
        console.error("Error al actualizar el producto", error);
        Notiflix.Report.failure(
          'Error',
          'Hubo un problema al actualizar el producto.',
          'Cerrar'
        );
      }
    );
  }

  closeModal(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  onSubmit() {
    this.currentPage = 1;
    this.applyFilter();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.selectedProduct) {
      this.selectedProduct.archivo = file;
    }
  }

  /** ---------- Helpers de búsqueda avanzada ---------- */

  /** Normaliza texto eliminando tildes, a minúsculas y colapsa espacios */
  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Tokeniza en palabras/números */
  private tokenize(text: string): string[] {
    const norm = this.normalizeText(text);
    return norm.match(/[a-z0-9]+/gi)?.map(t => this.normalizeText(t)) ?? [];
  }

  /** "Stem" muy ligero para plural/singular comunes (es, s) */
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
}
