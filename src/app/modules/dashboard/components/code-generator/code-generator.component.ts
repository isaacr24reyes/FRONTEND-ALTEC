import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Notiflix from 'notiflix';
import { MundialService } from '../../services/mundial.service';
import { UserSessionService } from '../../../authentication/services/user-session.service';

@Component({
  selector: 'app-code-generator',
  standalone: false,
  templateUrl: './code-generator.component.html',
  styleUrls: ['./code-generator.component.scss']
})
export class CodeGeneratorComponent implements OnInit {

  private readonly CHARS = 'ACDEFGHIJKLMNOPQRSTUWXYZ0123456789';

  generatedCode  = '';
  isGenerating   = false;
  isSaving       = false;
  history: { codigo: string; createdAt: string }[] = [];
  private userName = '';

  constructor(
    private mundialService: MundialService,
    private userSessionService: UserSessionService
  ) {}

  ngOnInit() {
    this.userSessionService.getUserInfo().subscribe(info => {
      if (info) this.userName = info.name ?? info.email ?? 'Admin';
    });
    this.loadHistory();
  }

  // ── Generar + guardar automáticamente ────────────────────────────────────
  generate() {
    if (this.isGenerating || this.isSaving) return;
    this.isGenerating = true;
    this.generatedCode = '';

    // Animación de rodillo
    let ticks = 0;
    const interval = setInterval(() => {
      this.generatedCode = this.randomCode();
      ticks++;
      if (ticks >= 18) {
        clearInterval(interval);
        const finalCode = this.randomCode();
        this.generatedCode = finalCode;
        this.isGenerating = false;
        this.save(finalCode);
      }
    }, 60);
  }

  // ── Guardar en BD ─────────────────────────────────────────────────────────
  private save(code: string) {
    this.isSaving = true;
    this.mundialService.saveCode(code, this.userName).subscribe({
      next: () => {
        this.isSaving = false;
        Notiflix.Notify.success(`Código "${code}" guardado correctamente`);
        this.history.unshift({
          codigo: code,
          createdAt: new Date().toLocaleString('es-EC', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        });
        if (this.history.length > 20) this.history.pop();
      },
      error: () => {
        this.isSaving = false;
        Notiflix.Notify.failure('Error al guardar el código. Intenta de nuevo.');
      }
    });
  }

  // ── Cargar historial desde BD ─────────────────────────────────────────────
  private loadHistory() {
    this.mundialService.getCodes().subscribe({
      next: (data: any[]) => {
        this.history = (data ?? [])
          .slice(0, 20)
          .map(d => ({
            codigo: d.codigo,
            createdAt: new Date(d.createdAt).toLocaleString('es-EC', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          }));
      },
      error: () => { /* silencioso si no hay datos aún */ }
    });
  }

  private randomCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
    }
    return code;
  }
}
