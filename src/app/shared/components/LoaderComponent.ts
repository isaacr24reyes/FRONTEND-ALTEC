import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../services/LoaderService';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="isLoading">
      <div class="progress w-50">
        <div class="progress-bar progress-bar-striped progress-bar-animated"
             role="progressbar"
             [style.width.%]="progress">
          {{ progress }}%
        </div>
      </div>
      <p class="text-white mt-2">Cargando.... {{ progress }}%</p>
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
