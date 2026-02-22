import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ProductService } from "../../warehouse/services/warehouse.service";
import html2pdf from 'html2pdf.js';
import Notiflix from "notiflix";
declare var bootstrap: any;
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';




@Component({
  selector: 'app-product-quote',
  templateUrl: './product-quote.component.html',
  styleUrls: ['./product-quote.component.scss']
})
export class ProductQuoteComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  products: any[] = [];
  selectedProduct: any;
  totalCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  private pageSize: number = 5;
  isFirstLoad: boolean = true;
  isLoading: boolean = true;
  cotizacion: any[] = [];
  resistorValues: string[] = [
    '1Ω','8.2Ω','10Ω','20Ω','22Ω','27Ω','47Ω','56Ω','62Ω','68Ω','75Ω','82Ω',
    '100Ω','110Ω','120Ω','200Ω','220Ω','240Ω','270Ω','300Ω','330Ω','360Ω',
    '390Ω','470Ω','510Ω','560Ω','680Ω','820Ω',

    '1kΩ','1.2kΩ','1.8kΩ','2kΩ','2.2kΩ','2.7kΩ','3.3kΩ','3.9kΩ','4.7kΩ',
    '5.1kΩ','5.6kΩ','6.2kΩ','6.8kΩ','8.2kΩ','10kΩ','12kΩ','15kΩ','16kΩ',
    '20kΩ','22kΩ','27kΩ','39kΩ','47kΩ','56kΩ','68kΩ','82kΩ','100kΩ',
    '120kΩ','150kΩ','220kΩ','270kΩ','330kΩ','470kΩ','560kΩ','750kΩ','820kΩ',

    '1MΩ','2.2MΩ','10MΩ'
  ];
  selectedCategory: string = '';
  onlyImport: boolean = false;
  onlyLowStock: boolean = false;

  categories = [
    'Audio y video',
    'Baquelitas',
    'Componentes Electrónicos',
    'Compuertas e Integrados',
    'Electricidad',
    'Fuentes',
    'Herramientas',
    'Microcontroladores y Arduinos',
    'Modulos y Sensores',
    'Motores',
    'Parlantes',
    'Pilas y Baterias',
    'Plugs y Conectores',
    'Protoboards',
    'Proyectos Y kits',
    'Redes y Comunicación',
    'Transformadores',
    'Otros'
  ];

  selectedResistorValue = '';
  isResistor: boolean = false;
  @ViewChild('pdfCotizacion', { static: false }) pdfCotizacion!: ElementRef;

  // Variables para modal de envío y loader
  shippingCost: number = 0;
  isDownloading: boolean = false;
  downloadMessage: string = '';

  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: [''],
      importCheck: [false],
      lowStockCheck: [false]
    });


    // Carga inicial: traemos un batch grande y filtramos en cliente
    this.getProducts();

    // Búsqueda reactiva con debounce
    this.formGroup.get('searchControl')!
      .valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilter();
      });
  }
  filtrarCategoria(categoria: string) {
    this.selectedCategory = categoria;
    this.currentPage = 1;
    this.applyFilter();
  }

  toggleImport() {
    this.onlyImport = this.formGroup.get('importCheck')?.value;
    this.currentPage = 1;
    this.applyFilter();
  }

  toggleLowStock() {
    this.onlyLowStock = this.formGroup.get('lowStockCheck')?.value;
    this.currentPage = 1;
    this.applyFilter();
  }

  // Limpiar todos los filtros
  clearAllFilters(): void {
    this.selectedCategory = '';
    this.onlyImport = false;
    this.onlyLowStock = false;
    this.formGroup.patchValue({
      importCheck: false,
      lowStockCheck: false
    });
    this.currentPage = 1;
    this.applyFilter();
  }

  onSubmit() {}
  openProductModal(product: any): void {
    this.selectedProduct = product;

    const desc = product.descripcion?.toLowerCase() || '';
    this.isResistor = desc.includes('resistencia') && desc.includes('1/4');
    this.selectedResistorValue = '';

    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getProducts(): void {
    if (this.isFirstLoad) {
      Notiflix.Loading.standard('Cargando productos...');
      this.isLoading = true;
    }

    // Ajusta 1000 si necesitas más/menos
    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc').subscribe({
      next: (data: any) => {
        const items = data?.items ?? [];
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
  applyFilter(): void {
    const raw = this.formGroup.get('searchControl')!.value || '';
    const tokens = this.tokenize(raw);

    let filtered = this.allProducts;

    // 🔹 Categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoria === this.selectedCategory);
    }

    // 🔹 Importación
    if (this.onlyImport) {
      filtered = filtered.filter(p => p.isImport);
    }

    // 🔹 Stock bajo
    if (this.onlyLowStock) {
      filtered = filtered.filter(p => p.stock < 5);
    }

    // 🔹 Texto (tu lógica existente)
    if (tokens.length) {
      filtered = filtered
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

    this.filteredProducts = filtered;
    this.totalCount = filtered.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  /** ---------- Paginación (cliente) ---------- */
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

  /** Escapa un token para expresiones regulares */
  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** ¿El texto contiene el token? Acepta coincidencia directa, raíz y bordes de palabra */
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

  /** Puntaje de relevancia para ordenar resultados */
  private scoreMatch(normDesc: string, normCode: string, tokens: string[]): number {
    let score = 0;

    for (const t of tokens) {
      const inCode = this.textContainsToken(normCode, t);
      const inDesc = this.textContainsToken(normDesc, t);

      if (inCode) score += 10;               // código pesa más
      if (inDesc) score += 4;

      // Bonus por palabra completa
      const tEsc = this.escapeRegExp(t);
      if (new RegExp(`\\b${tEsc}\\b`).test(normDesc)) score += 2;
      if (new RegExp(`\\b${tEsc}\\b`).test(normCode)) score += 4;

      // Bonus si comienza con el token
      if (normDesc.startsWith(t)) score += 2;
      if (normCode.startsWith(t)) score += 3;
    }

    // Bonus si TODOS los tokens están dentro de la misma cadena (proximidad simple)
    const allInDesc = tokens.every(t => this.textContainsToken(normDesc, t));
    const allInCode = tokens.every(t => this.textContainsToken(normCode, t));
    if (allInDesc) score += 5;
    if (allInCode) score += 8;

    return score;
  }

  /** ---------- Cotización / PDF (tu lógica intacta) ---------- */

  async agregarACotizacion(item: any) {

    // 🔌 Si es resistencia, exige valor
    if (this.isResistor) {
      if (!this.selectedResistorValue) {
        Notiflix.Notify.warning('Selecciona el valor de la resistencia');
        return;
      }

      item = {
        ...item,
        descripcion: `${item.descripcion} - ${this.selectedResistorValue}`
      };
    }

    const nuevoItem = { ...item };
    nuevoItem.foto = item.foto;

    if (item.foto) {
      try {
        const base64 = await this.getBase64ImageFromURL(item.foto);
        nuevoItem.fotoBase64 = base64;
      } catch {
        nuevoItem.fotoBase64 = null;
      }
    }

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
      img.onerror = () => reject('No se pudo cargar la imagen desde la URL: ' + url);
      img.src = url;
    });
  }

  close(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  eliminarDeCotizacion(index: number): void {
    this.cotizacion.splice(index, 1);
  }

  // Incrementar cantidad
  incrementarCantidad(index: number): void {
    this.cotizacion[index].cantidad++;
    this.cotizacion[index].total = this.cotizacion[index].cantidad * this.cotizacion[index].precio;
  }

  // Decrementar cantidad
  decrementarCantidad(index: number): void {
    if (this.cotizacion[index].cantidad > 1) {
      this.cotizacion[index].cantidad--;
      this.cotizacion[index].total = this.cotizacion[index].cantidad * this.cotizacion[index].precio;
    } else {
      // Si la cantidad es 1, eliminar el producto
      this.eliminarDeCotizacion(index);
    }
  }

  get totalCotizacion(): number {
    return this.cotizacion.reduce((acc, item) => acc + item.total, 0);
  }

  async descargarPDF() {
    this.isDownloading = true;
    this.downloadMessage = 'Generando PDF...';

    await new Promise(resolve => setTimeout(resolve, 500));

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Guayaquil', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    const fechaHoraFormateada = new Intl.DateTimeFormat('es-EC', options).format(now);
    const [fecha, hora] = fechaHoraFormateada.split(',');

    const header = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #0C1E3A;">
      <div style="flex: 0 0 auto;">
        <img src="assets/images/Logo-completo.jpeg" alt="Logo ALTEC" style="max-height: 80px;">
      </div>
      <div style="flex: 1; text-align: center; padding: 0 20px;">
        <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #0C1E3A;">COTIZACIÓN</h1>
        <div style="font-size: 11px; color: #555;">
          <p style="margin: 3px 0;"><strong>Fecha:</strong> ${fecha.trim()} | <strong>Hora:</strong> ${hora.trim()}</p>
          <p style="margin: 3px 0;"><strong>Ubicación:</strong> Quito, Villaflora, Rodrigo de Chávez</p>
          <p style="margin: 3px 0;"><strong>WhatsApp:</strong> (099) 515-9078</p>
        </div>
      </div>
      <div style="flex: 0 0 auto; width: 80px;"></div>
    </div>`;

    let tableRows = '';
    this.cotizacion.forEach((item, index) => {
      const totalFormatted = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.total);
      const precioFormatted = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.precio || 0);
      const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';

      tableRows += `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #dee2e6; padding: 8px; font-size: 11px;">${item.descripcion}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; font-size: 11px;">
          ${item.fotoBase64 ? `<img src="${item.fotoBase64}" alt="Producto" style="max-height: 50px; max-width: 50px; object-fit: contain;">`
            : item.foto ? `<img src="${item.foto}" alt="Producto" style="max-height: 50px; max-width: 50px; object-fit: contain;">`
            : '—'}
        </td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; font-size: 11px; font-weight: bold;">${item.cantidad}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right; font-size: 11px;">${precioFormatted}</td>
        <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; color: #0C1E3A;">${totalFormatted}</td>
      </tr>`;
    });

    const table = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
      <thead>
        <tr style="background: linear-gradient(135deg, #0C1E3A, #1a3a5c); color: white;">
          <th style="padding: 10px; border: 1px solid #0C1E3A; text-align: left;">Producto</th>
          <th style="padding: 10px; border: 1px solid #0C1E3A; width: 80px;">Imagen</th>
          <th style="padding: 10px; border: 1px solid #0C1E3A; width: 80px;">Cantidad</th>
          <th style="padding: 10px; border: 1px solid #0C1E3A; width: 100px; text-align: right;">Precio Unit.</th>
          <th style="padding: 10px; border: 1px solid #0C1E3A; width: 100px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <tr style="background: linear-gradient(135deg, #10B981, #059669); color: white;">
          <td colspan="4" style="text-align: right; font-weight: bold; padding: 12px; border: 1px solid #059669; font-size: 13px;">TOTAL GENERAL:</td>
          <td style="font-weight: bold; padding: 12px; border: 1px solid #059669; text-align: right; font-size: 15px;">
            ${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(this.totalCotizacion)}
          </td>
        </tr>
      </tfoot>
    </table>`;

    const footer = `
    <div style="margin-top: 25px; padding: 15px; border: 2px dashed #0C1E3A; border-radius: 8px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe);">
      <h3 style="color: #0C1E3A; font-weight: bold; margin: 0 0 10px 0; font-size: 14px; text-align: center;">
        💳 INFORMACIÓN DE PAGO
      </h3>
      <div style="text-align: center; font-size: 11px; color: #333;">
        <p style="margin: 5px 0; font-weight: bold; font-size: 13px;">ALTEC MECATRÓNICA</p>
        <p style="margin: 5px 0;"><strong>Titular:</strong> JOSHUA ISAAC REYES HEREDIA</p>
        <p style="margin: 5px 0;"><strong>CI:</strong> 1718068578</p>
        <p style="margin: 5px 0;"><strong>Banco:</strong> PICHINCHA - Cuenta de Ahorros</p>
        <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #0C1E3A;">N° 2204742473</p>
      </div>
    </div>

    <div style="margin-top: 15px; padding: 10px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #dee2e6;">
      <p style="margin: 5px 0;">✨ Gracias por su preferencia ✨</p>
      <p style="margin: 5px 0;">Cotización generada el ${fecha.trim()} a las ${hora.trim()}</p>
      <p style="margin: 5px 0; font-weight: bold; color: #8B50FB;">Developed by SwiFt© 2025</p>
    </div>`;

    // Add quotation number to the PDF
    const pdfHeader = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0C1E3A; font-weight: bold;">Cotización N°: {{ quotationNumber }}</h2>
    </div>`;

    container.innerHTML = pdfHeader + header + table + footer;

    const opciones = {
      margin: [10, 10, 10, 10],
      filename: `ALTEC-Cotizacion-${now.toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        logging: false,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().from(container).set(opciones).save();
      this.downloadMessage = '¡PDF descargado exitosamente!';
      await new Promise(resolve => setTimeout(resolve, 1000));
      Notiflix.Notify.success('PDF descargado correctamente');

      // Llamar al endpoint para guardar la cotización
      const quotationNumber = this.generateQuotationNumber(); // Generar un número único para la cotización
      const quotationDetails = this.cotizacion.map(product => ({
        productId: product.id,
        quantity: product.cantidad,
        unitPrice: product.precio // Assuming 'precio' is the unit price of the product
      }));

      const quotationPayload = {
        quotationNumber: quotationNumber,
        quotationDetails: quotationDetails
      };

      this.http.post(`${environment.apiALTEC}/api/cotizaciones`, quotationPayload).subscribe(
        response => {
          console.log('Cotización guardada exitosamente:', response);
          Notiflix.Notify.success('¡Cotización guardada exitosamente!');
        },
        error => {
          console.error('Error al guardar la cotización:', error);
          Notiflix.Notify.failure('Error al guardar la cotización');
        }
      );
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Notiflix.Notify.failure('Error al generar el PDF');
    } finally {
      this.isDownloading = false;
    }
  }

  incluirEnvio() {
    const envioExistente = this.cotizacion.find(item => item.descripcion === 'Envío');
    if (envioExistente) {
      this.shippingCost = envioExistente.precio;
    } else {
      this.shippingCost = 0;
    }

    const modalElement = document.getElementById('shippingModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmarEnvio() {
    const envioExistente = this.cotizacion.find(item => item.descripcion === 'Envío');

    if (this.shippingCost > 0) {
      if (envioExistente) {
        envioExistente.precio = this.shippingCost;
        envioExistente.total = this.shippingCost;
      } else {
        this.cotizacion.push({
          descripcion: 'Envío',
          cantidad: 1,
          precio: this.shippingCost,
          total: this.shippingCost
        });
      }
      this.updateTotal();
      Notiflix.Notify.success(`Envío de ${this.shippingCost.toFixed(2)} agregado correctamente`);
    } else if (envioExistente) {
      // Si el costo es 0, eliminar el envío
      const index = this.cotizacion.indexOf(envioExistente);
      this.cotizacion.splice(index, 1);
      Notiflix.Notify.info('Envío eliminado de la cotización');
    }

    const modalElement = document.getElementById('shippingModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  updateTotal() {
    this.cotizacion = [...this.cotizacion];
  }
  async descargarExcelConImagenes() {
    this.isDownloading = true;
    this.downloadMessage = 'Generando Excel...';

    await new Promise(resolve => setTimeout(resolve, 500));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cotización ALTEC');

    // Estilos del header
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'COTIZACIÓN - ALTEC MECATRÓNICA';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0C1E3A' }
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Cabeceras
    const headerRow = worksheet.addRow(['Producto', 'Imagen', 'Cantidad', 'Precio Unit.', 'Total']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a3a5c' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    for (const item of this.cotizacion) {
      const row = worksheet.addRow([
        item.descripcion,
        '',
        item.cantidad,
        item.precio || 0,
        item.total
      ]);

      row.alignment = { vertical: 'middle', horizontal: 'left' };
      row.height = 60;

      if (item.foto) {
        try {
          const response = await fetch(item.foto);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();

          const imageId = workbook.addImage({
            buffer: buffer,
            extension: 'jpeg'
          });

          worksheet.addImage(imageId, {
            tl: { col: 1, row: row.number - 1 },
            ext: { width: 70, height: 50 }
          });
        } catch (err) {
          console.warn('No se pudo cargar la imagen:', err);
        }
      }
    }

    // Fila de total
    const totalRow = worksheet.addRow(['', '', '', 'TOTAL:', this.totalCotizacion]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    totalRow.getCell(5).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 50 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 15 }
    ];

    // Formatear como moneda
    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 2) {
        row.getCell(4).numFmt = '$#,##0.00';
        row.getCell(5).numFmt = '$#,##0.00';
      }
    });

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `ALTEC-Cotizacion-${new Date().toISOString().slice(0,10)}.xlsx`);
      this.downloadMessage = '¡Excel descargado exitosamente!';
      await new Promise(resolve => setTimeout(resolve, 1000));
      Notiflix.Notify.success('Excel descargado correctamente');
    } catch (error) {
      console.error('Error al generar Excel:', error);
      Notiflix.Notify.failure('Error al generar el Excel');
    } finally {
      this.isDownloading = false;
    }
  }

  async saveQuotation() {
    const quotationNumber = `Q-${Date.now()}`;
    const quotationDetails = this.cotizacion.map(item => ({
      productId: item.productId,
      quantity: item.cantidad,
      unitPrice: item.precio
    }));

    const quotationPayload = {
      quotationNumber,
      quotationDetails
    };

    try {
      await this.http.post(`${environment.apiALTEC}/api/cotizaciones`, quotationPayload).toPromise();
      console.log('Cotización guardada con éxito');
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
    }
  }


  private generateQuotationNumber(): string {
    // Generate a unique quotation number (e.g., using a timestamp or UUID)
    return `Q-${Date.now()}`;
  }

  private getSelectedProducts(): { id: string; quantity: number; unitPrice: number }[] {
    return this.selectedProduct.map((product: any) => ({
      id: product.id,
      quantity: product.quantity,
      unitPrice: product.unitPrice
    }));
  }
}
