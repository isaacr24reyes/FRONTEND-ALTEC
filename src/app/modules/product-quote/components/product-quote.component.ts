import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProductService } from "../../warehouse/services/warehouse.service";
import html2pdf from 'html2pdf.js';
import { ViewChild, ElementRef } from '@angular/core';
import Notiflix from "notiflix";
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
  isFirstLoad: boolean = true;
  isLoading: boolean = true;
  cotizacion: any[] = [];
  @ViewChild('pdfCotizacion', { static: false }) pdfCotizacion!: ElementRef;

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({ searchControl: [''] });
    this.getProducts(this.currentPage, this.pageSize);

    this.formGroup.get('searchControl')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => {
        this.currentPage = 1;
        this.getProducts(this.currentPage, this.pageSize, term);
      });
  }

  onSubmit() {}

  openProductModal(product: any): void {
    this.selectedProduct = product;
    console.log('Producto abierto:', product);
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

  async agregarACotizacion(item: any) {
    const nuevoItem = { ...item };

    nuevoItem.foto = item.foto;

    if (item.foto) {
      try {
        const base64 = await this.getBase64ImageFromURL(item.foto); // Cloudinary URL
        nuevoItem.fotoBase64 = base64;
      } catch (err) {
        console.warn('Error al convertir imagen a base64:', err);
        nuevoItem.fotoBase64 = null; // fallback
      }
    }

    console.log('Item agregado con imagen base64 (o URL):', nuevoItem);
    this.cotizacion.push(nuevoItem);
    this.close();
  }



  getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      };
      img.onerror = () => {
        reject('No se pudo cargar la imagen desde la URL: ' + url);
      };
      img.src = url;
    });
  }



  close(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    }
  }

  eliminarDeCotizacion(index: number): void {
    this.cotizacion.splice(index, 1);
  }

  get totalCotizacion(): number {
    return this.cotizacion.reduce((acc, item) => acc + item.total, 0);
  }

  descargarPDF() {
    const container = document.createElement('div');
    container.style.width = '100%';
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Guayaquil', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    const fechaHoraFormateada = new Intl.DateTimeFormat('es-EC', options).format(now);
    const [fecha, hora] = fechaHoraFormateada.split(',');

    const header = `
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <div style="flex: 0 0 auto; margin-right: 20px;">
        <img src="assets/images/Logo-completo.jpeg" alt="Logo Empresa" style="max-height: 120px;">
      </div>
      <div style="flex: 1; text-align: center;">
        <h2 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">COTIZACIÓN</h2>
        <div style="margin-bottom: 5px; font-size: 12px;">
          <p style="margin: 2px 0;"><strong>Fecha:</strong> ${fecha.trim()} | <strong>Hora:</strong> ${hora.trim()} (hora de Quito)</p>
          <p style="margin: 2px 0;"><strong>Ubicación:</strong> Quito, Villaflora, Rodrigo de Chávez. | <strong>WhatsApp:</strong> (099) 515-9078</p>
        </div>
      </div>
      <div style="flex: 0 0 auto; width: 80px;"></div>
    </div>`;

    const tableHeader = `
    <table style="width:100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #08274F; color: white;">
          <th style="padding: 6px; border: 1px solid #198754;">Producto</th>
          <th style="padding: 6px; border: 1px solid #198754;">Imagen</th>
          <th style="padding: 6px; border: 1px solid #198754;">Cantidad</th>
          <th style="padding: 6px; border: 1px solid #198754;">Precio unitario</th>
          <th style="padding: 6px; border: 1px solid #198754;">Total</th>
        </tr>
      </thead>
      <tbody>`;

    let tableBody = '';
    this.cotizacion.forEach(item => {
      const totalFormatted = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.total);
      const precioFormatted = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.precio || 0);
      tableBody += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 5px;">${item.descripcion}</td>
        <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">
${item.fotoBase64
        ? `<img src="${item.fotoBase64}" style="max-height: 60px;">`
        : item.foto
          ? `<img src="${item.foto}" style="max-height: 60px;">`
          : '—'}

        </td>
        <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${item.cantidad}</td>
        <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${precioFormatted}</td>
        <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${totalFormatted}</td>
      </tr>`;
    });

    const tableFooter = `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align: right; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd; padding: 5px;">Total general:</td>
          <td style="font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd; padding: 5px;">
            ${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(this.totalCotizacion)}
          </td>
        </tr>
      </tfoot>
    </table>`;

    const footerInfo = `
    <div style="margin-top: 30px; padding: 10px 20px; border-top: 2px dashed #ccc; text-align: center;">
      <h4 style="color: #198754; font-weight: bold; margin-bottom: 5px; font-size: 16px;">💵 Realiza tu pago a la siguiente cuenta</h4>
      <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #000;">ALTEC MECATRÓNICA</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">👤 <strong>JOSHUA ISAAC REYES HEREDIA</strong></p>
      <p style="margin: 4px 0; font-size: 14px;">CI: 1718068578</p>
      <p style="margin: 4px 0; font-size: 14px;">Cuenta Ahorros <strong>Banco PICHINCHA</strong></p>
      <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #0d6efd;">N° 2204742473</p>
    </div>`;

    container.innerHTML = header + tableHeader + tableBody + tableFooter + footerInfo;

    const opciones = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `cotizacion-${now.toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: false, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true }
    };

    html2pdf().from(container).set(opciones).save();
  }

  incluirEnvio() {
    const envioExistente = this.cotizacion.find(item => item.descripcion === 'Envío');
    if (envioExistente) {
      const nuevoValor = prompt('El envío ya está incluido. Ingrese el nuevo valor:', envioExistente.precio.toString());
      if (nuevoValor !== null) {
        const valorNumerico = parseFloat(nuevoValor);
        if (!isNaN(valorNumerico)) {
          envioExistente.precio = valorNumerico;
          envioExistente.total = valorNumerico;
          this.updateTotal();
        } else {
          alert('Por favor ingrese un valor numérico válido');
        }
      }
    } else {
      const valorEnvio = prompt('Ingrese el costo de envío:', '0');
      if (valorEnvio !== null) {
        const valorNumerico = parseFloat(valorEnvio);
        if (!isNaN(valorNumerico)) {
          this.cotizacion.push({ descripcion: 'Envío', cantidad: '', precio: '', total: valorNumerico });
          this.updateTotal();
        } else {
          alert('Por favor ingrese un valor numérico válido');
        }
      }
    }
  }

  updateTotal() {
    this.cotizacion = [...this.cotizacion];
  }
}
