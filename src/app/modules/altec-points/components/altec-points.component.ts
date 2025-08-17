import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  catchError,
  of
} from 'rxjs';
import {AccountService} from "../../authentication/services/account.service";


@Component({
  selector: 'app-altec-points',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './altec-points.component.html',
  styleUrl: './altec-points.component.scss'
})
export class AltecPointsComponent implements OnInit {
  @ViewChild('productDescriptionInput') productInput?: ElementRef<HTMLInputElement>;
  public formGroup!: UntypedFormGroup;
  private readonly POINTS_PER_DOLLAR = 10;
  showDropdown = false;
  activeIndex = -1;
  selectedItem: any | null = null;
  // Autocomplete state
  suggestions: any[] = [];
  loading = false;
  private blurTimer: any = null;
  selectedUser: any = null;
  isSubmitting = false;
  constructor(
    private fb: UntypedFormBuilder,
    private account: AccountService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      productDescription: ['', [Validators.required]],
      productCode: ['', []]
    });

    this.formGroup.get('productDescription')!.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      filter(v => typeof v === 'string' && v.trim().length >= 2),
      switchMap(q => {
        this.loading = true;
        this.showDropdown = true;
        this.activeIndex = -1;
        this.selectedUser = null;
        return this.account.searchUsersByName(q.trim(), 1, 10).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((res: any[]) => {
      this.suggestions = Array.isArray(res) ? res : [];
      this.loading = false;
      this.showDropdown = true;
    });
  }

  private toNumber(input: any): number {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') return NaN;
    const raw = input.trim();

    if (!raw) return NaN;

    // Detecta formato común con coma decimal (ej: 1.234,56)
    const commaAsDecimal = /^[\d.]+,\d{1,2}$/.test(raw);
    if (commaAsDecimal) {
      const normalized = raw.replace(/\./g, '').replace(',', '.');
      return Number(normalized);
    }

    // Formato con punto decimal
    const normalized = raw.replace(/,/g, ''); // quita separador de miles
    return Number(normalized);
  }
  private moneyToPoints(amount: number): number {
    const raw = amount * this.POINTS_PER_DOLLAR;
    return Math.floor(raw); // ⬅️ cámbialo por Math.round(raw) si prefieres
  }
  deferClose(): void {
    this.blurTimer = setTimeout(() => {
      this.showDropdown = false;
      this.blurTimer = null;
    }, 80);
  }
  private blurInput(): void {
    const el = this.productInput?.nativeElement;
    if (!el) return;
    requestAnimationFrame(() => el.blur());
  }
  onSearchKeydown(ev: KeyboardEvent): void {
    if (!this.showDropdown || (!this.suggestions.length && !this.loading)) return;

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % Math.max(this.suggestions.length, 1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.activeIndex = this.activeIndex <= 0 ? this.suggestions.length - 1 : this.activeIndex - 1;
    } else if (ev.key === 'Enter') {
      if (this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
        ev.preventDefault();
        this.selectSuggestion(this.suggestions[this.activeIndex]);
      }
    } else if (ev.key === 'Escape') {
      this.showDropdown = false;
      this.activeIndex = -1;
    }
  }

  onSelect(u: any, ev?: Event): void {
    if (this.blurTimer) { clearTimeout(this.blurTimer); this.blurTimer = null; }
    ev?.preventDefault();
    ev?.stopPropagation();

    const label = this.displayName(u);

    this.formGroup.get('productDescription')?.setValue(label, { emitEvent: false });
    this.formGroup.get('productDescription')?.markAsDirty();
    this.formGroup.get('productDescription')?.markAsTouched();

    this.showDropdown = false;
    this.loading = false;
    this.suggestions = [];
    this.selectedUser = u;
    this.selectedItem = u;
    this.activeIndex = -1;
    this.blurInput();
  }
  clearOnFocus(): void {
    const ctrl = this.formGroup.get('productDescription');
    ctrl?.setValue('', { emitEvent: false });
    this.activeIndex = -1;
    this.selectedItem = null;
    this.showDropdown = false;
    this.selectedUser = null;
    this.showDropdown = false;
  }

  selectSuggestion(u: any): void {
    const label = this.displayName(u);
    this.formGroup.get('productDescription')?.setValue(label, { emitEvent: false });
    this.showDropdown = false;
    this.loading = false;
    this.suggestions = [];
    this.selectedUser = u;
    this.selectedItem = u;
    this.activeIndex = -1;
    this.blurInput();
  }
  displayName(u: any): string {
    return u?.name ?? u?.username ?? u?.fullName ?? u?.email ?? '';
  }
  onSubmit(): void {
    if (!this.formGroup.valid) return;

    const name: string =
      this.selectedUser?.name ??
      (this.formGroup.value.productDescription || '').toString().trim();

    const amountInput = this.formGroup.value.productCode; // tu "Monto de Venta"
    const amount = this.toNumber(amountInput);

    if (!name) {
      console.warn('Falta el nombre del cliente.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      console.warn('Monto inválido: ', amountInput);
      return;
    }

    const points = this.moneyToPoints(amount); // entero para el backend
    this.isSubmitting = true;

    this.account.addPoints(name, points).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Puntos acreditados:', { name, points, res });
        // aquí puedes mostrar un toast / notificación si quieres
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error acreditando puntos:', err);
      }
    });
  }
}
