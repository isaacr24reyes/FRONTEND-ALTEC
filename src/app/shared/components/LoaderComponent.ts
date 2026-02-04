import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../services/LoaderService';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modern-loader-overlay" *ngIf="isLoading">
      <!-- Fondo con blur -->
      <div class="loader-backdrop"></div>

      <!-- Contenedor del loader -->
      <div class="loader-container">

        <!-- Spinner circular moderno -->
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-core">
            <i class="bi bi-lightning-charge-fill"></i>
          </div>
        </div>

        <!-- Barra de progreso moderna -->
        <div class="loader-progress-wrapper">
          <div class="loader-progress-bar">
            <div class="loader-progress-fill" [style.width.%]="progress">
              <div class="progress-shimmer"></div>
            </div>
          </div>
          <div class="loader-progress-text">
            <span class="progress-label">Cargando productos</span>
            <span class="progress-percentage">{{ progress }}%</span>
          </div>
        </div>

        <!-- Texto animado -->
        <div class="loader-message">
          <span class="dot-animation">Preparando tu experiencia de compra</span>
        </div>

        <!-- Brand -->
        <div class="loader-brand">
          <span class="brand-purple">SwiFt©</span> Store
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  isLoading = false;
  progress = 0;

  constructor(public loaderService: LoaderService) {}

  ngOnInit() {
    this.loaderService.isLoading$.subscribe(status => {
      this.isLoading = status;
    });
    this.loaderService.progress$.subscribe(value => {
      this.progress = value;
    });
  }
}
