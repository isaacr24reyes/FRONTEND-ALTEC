import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { NgForOf, CurrencyPipe, NgIf } from '@angular/common';
import { ProductService } from "../../warehouse/services/warehouse.service";
import { LoaderService } from "../../../shared/services/LoaderService";
import { LoaderComponent } from "../../../shared/components/LoaderComponent";
import Notiflix from "notiflix";
import {CartService} from "../../../shared/services/CartService";



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
  cart: any[] = [];
  cartItemCount: number = 0;

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
}
