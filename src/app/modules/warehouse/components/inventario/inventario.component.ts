import { Component } from '@angular/core';
import {UntypedFormGroup} from "@angular/forms";

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent {
  public formGroup!: UntypedFormGroup;
  onSubmit() {

  }
}
