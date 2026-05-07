import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import Notiflix from 'notiflix';
import { MundialService } from '../dashboard/services/mundial.service';

export interface Pronostico {
  id?:            number;
  codigoUnico:    string;
  nombre:         string;
  campeon:        string;
  subcampeon:     string;
  tercerLugar:    string;
  cuartoLugar:    string;
  goleador:       string;
  resultadoFinal: string;
  fecha:          string;
}

export type CodeStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'used';

@Component({
  selector: 'app-mundial-2026',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './mundial-2026.component.html',
  styleUrls: ['./mundial-2026.component.scss']
})
export class Mundial2026Component implements OnDestroy {

  view: 'menu' | 'register' | 'list' = 'menu';
  form: FormGroup;
  submitted    = false;
  isLoading    = true;
  isSaving     = false;
  pronosticos: Pronostico[] = [];
  loadingList  = false;

  codeStatus: CodeStatus = 'idle';
  codeMessage            = '';
  searchTerm             = '';

  get filteredPronosticos(): Pronostico[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.pronosticos;
    return this.pronosticos.filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      p.codigoUnico.toLowerCase().includes(term)
    );
  }

  private destroy$ = new Subject<void>();
  private codeInput$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private mundialService: MundialService
  ) {
    this.form = this.fb.group({
      codigoUnico:    ['', [Validators.required, Validators.minLength(6)]],
      nombre:         ['', [Validators.required, Validators.minLength(3)]],
      telefono:       ['', [Validators.required, Validators.pattern('^[0-9]{7,15}$')]],
      campeon:        ['', Validators.required],
      subcampeon:     ['', Validators.required],
      tercerLugar:    ['', Validators.required],
      cuartoLugar:    ['', Validators.required],
      goleador:       ['', Validators.required],
      resultadoFinal: ['', [Validators.required, Validators.pattern('^[0-9]+-[0-9]+$')]]
    });

    // Validación con debounce al escribir el código
    this.codeInput$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(codigo => {
        if (!codigo || codigo.length < 6) {
          this.codeStatus  = 'idle';
          this.codeMessage = '';
          return [];
        }
        this.codeStatus  = 'checking';
        this.codeMessage = '';
        return this.mundialService.validateCode(codigo);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res.valid) {
          this.codeStatus  = 'valid';
          this.codeMessage = res.message;
        } else {
          this.codeStatus  = res.message?.includes('utilizado') ? 'used' : 'invalid';
          this.codeMessage = res.message;
        }
      },
      error: () => {
        this.codeStatus  = 'invalid';
        this.codeMessage = 'No se pudo verificar el código.';
      }
    });

    setTimeout(() => { this.isLoading = false; }, 2200);
  }

  get f() { return this.form.controls; }

  onCodeInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toUpperCase().trim();
    this.codeInput$.next(value);
  }

  goTo(v: 'menu' | 'register' | 'list') {
    if (v === 'list') { this.searchTerm = ''; this.loadPronosticos(); }
    if (v === 'register') this.resetForm();
    this.view = v;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private resetForm() {
    this.form.reset();
    this.submitted    = false;
    this.codeStatus   = 'idle';
    this.codeMessage  = '';
  }

  // ── Guardar pronóstico ────────────────────────────────────────────────────
  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      Notiflix.Notify.warning('Por favor completa todos los campos correctamente.');
      return;
    }

    if (this.codeStatus !== 'valid') {
      Notiflix.Notify.warning('Ingresa un código de participación válido.');
      return;
    }

    this.isSaving = true;
    const v = this.form.value;

    this.mundialService.savePronostico({
      codigoUnico:    v.codigoUnico.toUpperCase().trim(),
      nombre:         v.nombre,
      telefono:       v.telefono,
      campeon:        v.campeon,
      subcampeon:     v.subcampeon,
      tercerLugar:    v.tercerLugar,
      cuartoLugar:    v.cuartoLugar,
      goleador:       v.goleador,
      resultadoFinal: v.resultadoFinal
    }).subscribe({
      next: () => {
        this.isSaving = false;
        Notiflix.Notify.success('¡Pronóstico registrado! ¡Mucha suerte en el Mundial 2026! 🏆');
        this.resetForm();
        this.goTo('menu');
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.error ?? 'Error al registrar el pronóstico.';
        Notiflix.Notify.failure(msg);
      }
    });
  }

  // ── Cargar lista desde BD ─────────────────────────────────────────────────
  loadPronosticos() {
    this.loadingList = true;
    this.mundialService.getPronosticos().subscribe({
      next: (data: any[]) => {
        this.loadingList = false;
        this.pronosticos = (data ?? []).map(p => ({
          id:             p.id,
          codigoUnico:    p.codigoUnico,
          nombre:         p.nombre,
          campeon:        p.campeon,
          subcampeon:     p.subcampeon,
          tercerLugar:    p.tercerLugar,
          cuartoLugar:    p.cuartoLugar,
          goleador:       p.goleador,
          resultadoFinal: p.resultadoFinal,
          fecha: new Date(p.createdAt).toLocaleDateString('es-EC', {
            day: '2-digit', month: 'short', year: 'numeric'
          })
        }));
      },
      error: () => {
        this.loadingList = false;
        Notiflix.Notify.failure('No se pudieron cargar los pronósticos.');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
