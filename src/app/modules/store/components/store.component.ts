import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { NgForOf, CurrencyPipe, NgIf } from '@angular/common';
import { ProductService } from "../../warehouse/services/warehouse.service";
import { LoaderService } from "../../../shared/services/LoaderService";
import { LoaderComponent } from "../../../shared/components/LoaderComponent";

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
  allProducts: any[] = [];   // Lista completa de productos
  products: any[] = [];      // Lista visible en la página actual
  totalCount = 0;
  currentPage = 1;
  totalPages = 0;
  pageSize = 12;             // Productos por página
  searchTerm = '';

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchTerm: ['']
    });
    this.loaderService.start();
    this.loadProducts();
  }

  /** Carga todos los productos desde el backend */
  loadProducts(): void {
    this.productService.getProductsClient(1, 1000, '') // Pedimos todos (1-1000)
      .subscribe({
        next: (data: any) => {
          this.allProducts = (data?.items ?? []).map((p: any) => ({ ...p, cantidad: 1 }));
          this.applyFilter();
          this.loaderService.finish();
        },
        error: (err) => {
          console.error('Error al obtener productos:', err);
          this.loaderService.finish();
        }
      });
  }

  /** Aplica el filtro y la paginación en el frontend */
  applyFilter(): void {
    const term = this.normalizeText(this.formGroup.value.searchTerm || '');
    const filtered = term
      ? this.allProducts.filter(product =>
        this.normalizeText(product.descripcion).includes(term) ||
        this.normalizeText(product.codigo).includes(term)
      )
      : this.allProducts;

    this.totalCount = filtered.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(startIndex, startIndex + this.pageSize);
  }
  private normalizeText(text: string): string {
    return text
      ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      : '';
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  /** Paginación */
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

  /** Agregar al carrito */
  addToCart(product: any): void {
    console.log('Producto agregado:', product);
  }

  /** Submit del formulario */
  onSubmit() {
    this.applyFilter();
  }
}
