import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProductService } from "../../warehouse/services/warehouse.service";
import html2pdf from 'html2pdf.js';
import { ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('pdfCotizacion', { static: false }) pdfCotizacion!: ElementRef;

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
  descargarPDF() {
    const container = document.createElement('div');
    container.style.width = '100%';

    // Configuración de fecha/hora
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const fechaHoraFormateada = new Intl.DateTimeFormat('es-EC', options).format(now);
    const [fecha, hora] = fechaHoraFormateada.split(',');

    // Encabezado
    const header = `
  <div style="display: flex; align-items: center; margin-bottom: 15px;">
    <!-- Logo a la izquierda -->
    <div style="flex: 0 0 auto; margin-right: 20px;">
      <img src="assets/images/Logo-completo.jpeg" alt="Logo Empresa" style="max-height: 150px;">
    </div>

    <!-- Información centrada -->
    <div style="flex: 1; text-align: center;">
      <h2 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">COTIZACIÓN</h2>
      <div style="margin-bottom: 5px; font-size: 12px;">
        <p style="margin: 2px 0;"><strong>Fecha:</strong> ${fecha.trim()} | <strong>Hora:</strong> ${hora.trim()} (hora de Quito)</p>
        <p style="margin: 2px 0;"><strong>Ubicación:</strong> Quito,Villaflora, Rodrigo de Chávez. | <strong>WhatsApp:</strong> (099) 515-9078</p>
      </div>
    </div>

    <!-- Espacio vacío a la derecha para balancear -->
    <div style="flex: 0 0 auto; width: 80px;"></div>
  </div>
`;

    // Clonar contenido
    const content = this.pdfCotizacion.nativeElement.cloneNode(true);

    // Estilos de tabla
    const table = content.querySelector('table');
    if (table) {
      table.style.width = '100%';
      table.style.margin = '0';
      table.style.padding = '0';
      table.style.borderCollapse = 'collapse';
    }
    const tableHeaders = content.querySelectorAll('thead th');
    tableHeaders.forEach((header: HTMLElement) => {
      header.style.backgroundColor = '#08274F';
      header.style.color = 'white';
      header.style.fontWeight = 'bold';
      header.style.border = '1px solid #08274F';
      header.style.padding = '5px 8px';
      header.style.fontSize = '12px';
    });

    const tableCells = content.querySelectorAll('td');
    tableCells.forEach((cell: HTMLElement) => {
      cell.style.padding = '5px 8px';
      cell.style.fontSize = '12px';
      cell.style.border = '1px solid #ddd';
    });

    // Ocultar columna Eliminar
    const eliminarHeaders = content.querySelectorAll('th:nth-child(5)');
    const eliminarCells = content.querySelectorAll('td:nth-child(5)');
    eliminarHeaders.forEach((el: HTMLElement) => el.style.display = 'none');
    eliminarCells.forEach((el: HTMLElement) => el.style.display = 'none');

    // Formatear el total como moneda manualmente (solución alternativa)
    const formattedTotal = new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(this.totalCotizacion);

    // Pie de tabla
    const tfoot = content.querySelector('tfoot');
    if (tfoot) {
      tfoot.innerHTML = `
      <tr>
        <td colspan="2" style="border: none;"></td>
        <td style="text-align: right; font-weight: bold; border: 1px solid #ddd; padding: 5px 8px; background-color: #f8f9fa;">Total general:</td>
        <td style="font-weight: bold; border: 1px solid #ddd; padding: 5px 8px; background-color: #f8f9fa;">${formattedTotal}</td>
      </tr>
    `;
    }

    container.innerHTML = header;
    container.appendChild(content);

    const opciones = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `cotizacion-${now.toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        logging: false,
        useCORS: true
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait',
        compress: true
      }
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
          this.cotizacion.push({
            descripcion: 'Envío',
            cantidad: "",
            precio: "",
            total: valorNumerico
          });
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
