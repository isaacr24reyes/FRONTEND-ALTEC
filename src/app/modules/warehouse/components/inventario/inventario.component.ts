import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ProductService } from '../../services/warehouse.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Notiflix from "notiflix";
declare var bootstrap: any;
import jsPDF from "jspdf";

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  public formGroup!: UntypedFormGroup;
  allProducts: any[] = [];
  products: any[] = [];
  totalCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  private pageSize: number = 5;
  selectedProduct: any;
  isFirstLoad: boolean = true;
  isLoading: boolean = true;
  tipoInventario: string = 'estudiante';
  selectedCategory: string = "";
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
  constructor(
    private productService: ProductService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      searchControl: [''],
      importCheck: [false],
      lowStockCheck: [false]
    });
    this.getAllProducts();
    this.formGroup.get('searchControl')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.applyFilter();
      });
  }
  filtrarCategoria(categoria: string, event?: Event) {
    if (event) event.preventDefault();

    this.selectedCategory = categoria;
    this.currentPage = 1; // reinicia paginación al aplicar filtro
    this.applyFilter();
  }
  toggleLowStock() {
    this.onlyLowStock = this.formGroup.get('lowStockCheck')?.value;
    this.currentPage = 1;
    this.applyFilter();
  }
  toggleImport() {
    this.onlyImport = this.formGroup.get('importCheck')?.value;
    this.currentPage = 1;
    this.applyFilter();
  }



  getAllProducts(): void {
    if (this.isFirstLoad) {
      Notiflix.Loading.standard('Cargando productos...');
      this.isLoading = true;
    }

    this.productService.getProducts(1, 1000, '', 'descripcion', 'asc').subscribe({
      next: (data: any) => {
        this.allProducts = (data.items || []).map((p: any) => ({
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

    // 🔹 Filtro por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoria === this.selectedCategory);
    }

    // 🔹 Filtro por importación
    if (this.onlyImport) {
      filtered = filtered.filter(p => p.isImport === true || p.isImport === 1);
    }

    // 🔹 Filtro por stock bajo (< 5)
    if (this.onlyLowStock) {
      filtered = filtered.filter(p => p.stock < 5);
    }

    // 🔹 Filtro por texto
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

    // 🔹 Actualiza contador y paginación
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

  openProductModal(product: any): void {
    this.selectedProduct = product;
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(text: string): string[] {
    const norm = this.normalizeText(text);
    return norm.match(/[a-z0-9]+/gi)?.map(t => this.normalizeText(t)) ?? [];
  }

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

  onSubmit() {}
  async descargarPDF() {
    if (!this.allProducts || this.allProducts.length === 0) {
      console.warn("No hay productos en allProducts");
      return;
    }

    Notiflix.Loading.standard("Generando catálogo...");

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // 🔹 Cabecera
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Guayaquil",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const fechaHoraFormateada = new Intl.DateTimeFormat("es-EC", options).format(now);
    const [fecha, hora] = fechaHoraFormateada.split(",");

    doc.addImage("assets/images/Logo-completo.jpeg", "JPEG", 10, 10, 40, 20);
    doc.setFontSize(16);
    doc.text(
      this.tipoInventario === "importador"
        ? "CATÁLOGO MAYORISTA"
        : "CATÁLOGO ESTUDIANTES",
      pageWidth / 2,
      20,
      { align: "center" }
    );
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha.trim()} | Hora: ${hora.trim()} (hora de Quito)`, pageWidth / 2, 27, { align: "center" });
    doc.text("Ubicación: Quito, Villaflora, Rodrigo de Chávez. | WhatsApp: (099) 515-9078", pageWidth / 2, 32, { align: "center" });

    y = 40;

    // 🔹 Iteramos categorías
    for (const categoria of this.categories) {
      const productosCat = this.allProducts.filter(
        (p) =>
          p.categoria === categoria &&
          (this.tipoInventario !== "importador" || p.isImport === true || p.isImport === 1)
      );
      if (productosCat.length === 0) continue;

      // Título categoría
      doc.setFontSize(14);
      doc.setTextColor(8, 39, 79);
      doc.text(categoria, 10, y);
      y += 8;

      // Encabezado tabla
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(8, 39, 79);
      doc.rect(10, y, pageWidth - 20, 8, "F");
      doc.text("Código", 12, y + 6);
      doc.text("Descripción", 45, y + 6);
      doc.text(
        this.tipoInventario === "importador" ? "Precio Mayorista" : "PVP",
        140,
        y + 6
      );
      doc.text("Imagen", 170, y + 6);
      y += 12;

      // Filas
      doc.setTextColor(0, 0, 0);
      for (const prod of productosCat) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Código
        doc.text(prod.codigo || "", 12, y);

        // 🔹 Descripción multilínea
        const descripcion = prod.descripcion || "";
        const descLines = doc.splitTextToSize(descripcion, 90);
        const lineHeight = 6;
        const descHeight = descLines.length * lineHeight;
        doc.text(descLines, 45, y);

        // 🔹 Calculamos Y centrada para precio e imagen
        const centroFila = y + descHeight / 2;

        const precio =
          this.tipoInventario === "importador"
            ? prod.precioMayorista
            : prod.pvp;
        doc.text(
          new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency: "USD",
          }).format(precio || 0),
          this.tipoInventario === "importador" ? 130 : 140,
          centroFila
        );

        if (prod.foto && prod.foto !== "NOT-IMAGE") {
          try {
            const imgData = await this.loadImageAsBase64(prod.foto);
            doc.addImage(imgData, "JPEG", 170, centroFila - 7, 20, 15);
          } catch (e) {
            console.warn("No se pudo cargar imagen:", prod.foto);
          }
        }

        // 🔹 Avanzamos según la descripción más alta
        y += Math.max(descHeight, 20);
      }

      // Salto entre categorías
      y += 10;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    }

    doc.save(
      `${this.tipoInventario === "importador" ? "catalogo-mayorista" : "catalogo-estudiantes"}-${
        new Date().toISOString().slice(0, 10)
      }.pdf`
    );

    Notiflix.Loading.remove();
  }


// 🔹 Convierte URL a Base64
  private loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No se pudo crear contexto");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
