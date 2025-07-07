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
  products: any[] = [];
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
    // Crear el formulario con un campo de búsqueda
    this.formGroup = this.fb.group({
      searchControl: ['']
    });

    this.getProducts(this.currentPage, this.pageSize);

    // Escuchar cambios en el campo de búsqueda con debounce
    this.formGroup.get('searchControl')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.currentPage = 1;
        this.getProducts(this.currentPage, this.pageSize, term);
      });
  }
  openProductModal(product: any): void {
    this.selectedProduct = product;
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getProducts(
    pageNumber: number,
    pageSize: number,
    filter: string = '',
    sortBy: string = 'descripcion',
    sortOrder: string = 'asc'
  ): void {
    if (this.isFirstLoad) {
      Notiflix.Loading.standard('Cargando productos...');
      this.isLoading = true;
    }

    this.productService.getProducts(pageNumber, pageSize, filter, sortBy, sortOrder).subscribe({
      next: (data: any) => {
        this.products = data.items;
        console.log(data.items);
        this.totalCount = data.totalCount;
        this.totalPages = Math.ceil(this.totalCount / pageSize);

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

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      const term = this.formGroup.get('searchControl')!.value || '';
      this.getProducts(this.currentPage, this.pageSize, term);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      const term = this.formGroup.get('searchControl')!.value || '';
      this.getProducts(this.currentPage, this.pageSize, term);
    }
  }
  onSubmit() {}
}
