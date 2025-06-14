import { Component, OnInit } from '@angular/core';
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import { ProductService } from "../../services/warehouse.service";
import { CommonModule } from '@angular/common';
import Notiflix from 'notiflix';

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
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedProduct: any;
  currentPage = 1;
  pageSize = 25;
  totalCount: number = 0;
  totalPages: number = 0;

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: ['']
    });

    this.getProducts();

    this.formGroup.get('searchControl')?.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.getProducts();
    });

  }

  getProducts(): void {
    const term = this.formGroup.get('searchControl')?.value ?? '';
    this.productService.getProducts(this.currentPage, this.pageSize, term).subscribe((response: any) => {
      this.products = response.items;
      this.totalCount = response.totalCount ?? 0;
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    });
  }



  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getProducts();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getProducts();
    }
  }


  openModal(producto: any): void {
    this.selectedProduct = { ...producto }; // clonar para no mutar directamente
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
        const index = this.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
          this.filteredProducts = [...this.products];
        }

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
      modal.hide();
    }
  }

  onSubmit() {

  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedProduct.archivo = file;
    }
  }

}
