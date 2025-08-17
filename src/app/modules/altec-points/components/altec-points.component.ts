import { Component, OnInit } from '@angular/core';
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
  public formGroup!: UntypedFormGroup;

  // Autocomplete state
  suggestions: any[] = [];
  loading = false;
  showDropdown = false;
  activeIndex = -1;
  selectedUser: any = null;

  constructor(
    private fb: UntypedFormBuilder,
    private account: AccountService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      productDescription: ['', [Validators.required]], // aquí escribes el nombre del cliente
      productCode: ['', []] // tu monto de venta (lo dejé tal cual)
    });

    // Suscripción al input con debounce
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
      // si no hay resultados, igual mostramos el dropdown para el mensaje “Sin resultados”
      this.showDropdown = true;
    });
  }

  // UX helpers
  onSearchFocus(): void {
    if (this.suggestions.length || this.loading) {
      this.showDropdown = true;
    }
  }

  onSearchBlur(): void {
    // pequeño delay para permitir el mousedown del item
    setTimeout(() => {
      this.showDropdown = false;
      this.activeIndex = -1;
    }, 120);
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

  selectSuggestion(u: any): void {
    const name = this.displayName(u);
    this.formGroup.patchValue({ productDescription: name });
    this.selectedUser = u;
    this.showDropdown = false;
    this.activeIndex = -1;
  }

  // Dado que no tipamos el DTO, tomamos el mejor campo disponible
  displayName(u: any): string {
    return u?.name ?? u?.username ?? u?.fullName ?? u?.email ?? '';
  }

  onSubmit(): void {
    if (!this.formGroup.valid) return;

  }
}
