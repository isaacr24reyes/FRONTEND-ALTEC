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
  allProducts: any[] = [];   // Lista completa
  products: any[] = [];      // Productos visibles en página actual
  totalCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  private pageSize: number = 5;
  selectedProduct: any;
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

    this.getAllProducts();

    // Detectar cambios en el campo de búsqueda
    this.formGroup.get('searchControl')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilter();
      });
  }

  /** Trae todos los productos del backend una sola vez */
  getAllProducts(): void {
    if (this.isFirstLoad) {
      Notiflix.Loading.standard('Cargando productos...');
      this.isLoading = true;
    }

    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc').subscribe({
      next: (data: any) => {
        this.allProducts = data.items || [];
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

  /** Filtra y pagina los productos en el frontend */
  applyFilter(): void {
    const term = this.normalizeText(this.formGroup.get('searchControl')!.value || '');
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

  /** Modal de producto */
  openProductModal(product: any): void {
    this.selectedProduct = product;
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  /** Normaliza texto eliminando tildes y pasando a minúsculas */
  private normalizeText(text: string): string {
    return text
      ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      : '';
  }

  onSubmit() {}
}
