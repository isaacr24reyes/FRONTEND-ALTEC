import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import Notiflix from 'notiflix';
import {
  ImportedQuotationDetail,
  ImportedQuotationItem,
  ImportedQuotationSummary,
  QuotationHistoryService
} from '../services/quotation-history.service';
import { UserSessionService } from '../../authentication/services/user-session.service';

@Component({
  selector: 'app-quotation-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './quotation-history.component.html',
  styleUrls: ['./quotation-history.component.scss']
})
export class QuotationHistoryComponent implements OnInit, OnDestroy {
  readonly MAX_FILE_MB = 50;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;

  quotations: ImportedQuotationSummary[] = [];
  isLoading = false;
  downloadingId: string | null = null;

  // Detalle
  selectedDetail: ImportedQuotationDetail | null = null;
  loadingDetailId: string | null = null;
  itemSearch = '';

  // Filtros
  searchTerm = '';
  startDate = '';
  endDate = '';

  private userName = 'ADMIN';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private quotationHistoryService: QuotationHistoryService,
    private userSessionService: UserSessionService
  ) {}

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      fecha: [this.today(), Validators.required]
    });

    this.userSessionService.getUserInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        if (info) this.userName = info.name ?? info.username ?? 'ADMIN';
      });

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadQuotations());

    this.loadQuotations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Listado ──────────────────────────────────────────────────────────────

  loadQuotations(): void {
    this.isLoading = true;
    this.quotationHistoryService.getAll({
      desde: this.startDate || undefined,
      hasta: this.endDate || undefined,
      buscar: this.searchTerm || undefined
    }).subscribe({
      next: (data) => {
        this.quotations = data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        Notiflix.Notify.failure('No se pudo cargar el historial de cotizaciones.');
      }
    });
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.loadQuotations();
  }

  get totalMonto(): number {
    return this.quotations.reduce((sum, q) => sum + (q.totalMonto || 0), 0);
  }

  get totalProductos(): number {
    return this.quotations.reduce((sum, q) => sum + (q.totalItems || 0), 0);
  }

  // ── Archivo ──────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    if (!this.isDragging) this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Ignorar el dragleave que se dispara al pasar sobre elementos hijos
    const zone = event.currentTarget as HTMLElement;
    if (zone.contains(event.relatedTarget as Node)) return;
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  removeFile(): void {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private setFile(file: File | null): void {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      Notiflix.Notify.failure('Solo se permiten archivos Excel .xlsx');
      return;
    }
    if (file.size > this.MAX_FILE_MB * 1024 * 1024) {
      Notiflix.Notify.failure(`El archivo supera el máximo de ${this.MAX_FILE_MB} MB`);
      return;
    }

    this.selectedFile = file;
    // Sugerir el nombre del archivo como nombre de la cotización si está vacío
    const nombreCtrl = this.uploadForm.get('nombre');
    if (!nombreCtrl?.value) {
      nombreCtrl?.setValue(file.name.replace(/\.xlsx$/i, ''));
    }
  }

  // ── Subida ───────────────────────────────────────────────────────────────

  upload(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      Notiflix.Notify.warning('Completa el nombre y la fecha.');
      return;
    }
    if (!this.selectedFile) {
      Notiflix.Notify.warning('Selecciona el archivo Excel.');
      return;
    }

    const { nombre, fecha } = this.uploadForm.value;
    this.isUploading = true;
    // Los Excel con fotos pesan varios MB: avisar que puede tardar
    const sizeMb = this.selectedFile.size / (1024 * 1024);
    Notiflix.Loading.standard(sizeMb > 5
      ? `Guardando cotización (${sizeMb.toFixed(1)} MB)... puede tardar hasta un minuto`
      : 'Guardando cotización...');

    this.quotationHistoryService.upload(nombre.trim(), fecha, this.selectedFile, this.userName).subscribe({
      next: (res) => {
        this.isUploading = false;
        Notiflix.Loading.remove();
        Notiflix.Notify.success(`Cotización "${res.nombre}" guardada: ${res.totalItems} productos.`);
        this.uploadForm.reset({ nombre: '', fecha: this.today() });
        this.removeFile();
        this.loadQuotations();
      },
      error: (err) => {
        this.isUploading = false;
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(err?.error?.error ?? 'No se pudo guardar la cotización.');
      }
    });
  }

  // ── Detalle ──────────────────────────────────────────────────────────────

  openDetail(q: ImportedQuotationSummary): void {
    this.loadingDetailId = q.id;
    this.itemSearch = '';
    this.quotationHistoryService.getDetail(q.id).subscribe({
      next: (detail) => {
        this.selectedDetail = detail;
        this.loadingDetailId = null;
      },
      error: () => {
        this.loadingDetailId = null;
        Notiflix.Notify.failure('No se pudo cargar el detalle de la cotización.');
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedDetail) this.closeDetail();
  }

  closeDetail(): void {
    this.selectedDetail = null;
    this.itemSearch = '';
  }

  get filteredItems(): ImportedQuotationItem[] {
    const items = this.selectedDetail?.items ?? [];
    const term = this.normalize(this.itemSearch);
    if (!term) return items;
    return items.filter(i => this.normalize(i.producto).includes(term));
  }

  get filteredItemsTotal(): number {
    return this.filteredItems.reduce((sum, i) => sum + (i.total || 0), 0);
  }

  get filteredItemsQty(): number {
    return this.filteredItems.reduce((sum, i) => sum + (i.cantidad || 0), 0);
  }

  // ── Descarga ─────────────────────────────────────────────────────────────

  download(q: ImportedQuotationSummary): void {
    this.downloadingId = q.id;
    this.quotationHistoryService.download(q.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = q.nombreArchivo || `${q.nombre}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: () => {
        this.downloadingId = null;
        Notiflix.Notify.failure('No se pudo descargar el archivo.');
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  formatSize(bytes: number): string {
    if (!bytes) return '0 KB';
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  /** La fecha llega como 'yyyy-MM-ddT00:00:00'; se toma solo la parte de fecha para evitar desfases de zona horaria */
  dateOnly(value: string): Date {
    const [y, m, d] = (value || '').substring(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  trackByFila(_: number, i: ImportedQuotationItem): number {
    return i.fila;
  }

  private normalize(text: string): string {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  trackById(_: number, q: ImportedQuotationSummary): string {
    return q.id;
  }

  private today(): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${mm}-${dd}`;
  }
}
