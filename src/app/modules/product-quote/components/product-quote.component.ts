import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProductService } from "../../warehouse/services/warehouse.service";
declare var bootstrap: any;

@Component({
  selector: 'app-product-quote',
  templateUrl: './product-quote.component.html',
  styleUrls: ['./product-quote.component.scss']
})

export class ProductQuoteComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  products: any[] = [];
  selectedProduct: any;
  totalCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  private pageSize: number = 5;

  cotizacion: any[] = [];

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

  onSubmit() {}

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
    this.productService.getProducts(pageNumber, pageSize, filter, sortBy, sortOrder).subscribe(
      (data: any) => {
        this.products = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = Math.ceil(this.totalCount / pageSize);
      },
      (error: any) => {
        console.error('Error al obtener los productos', error);
      }
    );
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

  agregarACotizacion(item: any) {
    this.cotizacion.push(item);
    this.close();
  }

  close(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement); // Obtener la instancia del modal
      modal.hide();
    }
  }


  eliminarDeCotizacion(index: number): void {
    this.cotizacion.splice(index, 1);
  }

  get totalCotizacion(): number {
    return this.cotizacion.reduce((acc, item) => acc + item.total, 0);
  }
}
