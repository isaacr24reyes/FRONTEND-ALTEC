import { Component } from '@angular/core';
import {FormGroup, UntypedFormGroup} from "@angular/forms";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  public formGroup!: UntypedFormGroup;

  onSubmit() {

  }
}
