import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public formGroup!: UntypedFormGroup;

  constructor(private _fb: UntypedFormBuilder) {}

  ngOnInit() {
    this.formGroup = this._fb.group({
      email: [null, Validators.compose([Validators.required])],
      password: [ '', Validators.required],
      confirmPassword: [ '', Validators.required]
    });
  }
}
