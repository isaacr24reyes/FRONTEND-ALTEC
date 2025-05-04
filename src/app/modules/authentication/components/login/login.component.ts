import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ApplicationBase } from '../../../utils/base/application.base';
import { R_DASHBOARD } from '../../../../constants/route.constants';
import Notiflix from 'notiflix';
import { AccountService } from '../../services/account.service';
import { UserSessionService } from '../../services/user-session.service'; // Importa el servicio

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends ApplicationBase implements OnInit {

  public formGroup!: UntypedFormGroup;

  constructor(
    private _fb: UntypedFormBuilder,
    private _router: Router,
    private _accountService: AccountService,
    private _userSessionService: UserSessionService
  ) {
    super();
  }

  ngOnInit() {
    this.formGroup = this._fb.group({
      username: [null, Validators.compose([Validators.required])],
      password: [null, Validators.compose([Validators.required])]
    });
  }

  public login(): void {
    if (this.formGroup.invalid) {
      Notiflix.Notify.failure('Por favor, complete todos los campos.');
      return;
    }

    const { username, password } = this.formGroup.value;

    Notiflix.Loading.circle('Autenticando...');

    this._accountService.login(username, password).subscribe({
      next: (response: { token: string; }) => {
        sessionStorage.setItem('token', response.token);
        Notiflix.Notify.success('Inicio de sesión exitoso.');
        this._accountService.getUserInfo(username).subscribe({
          next: (userInfo) => {
            console.log('Información del usuario:', userInfo);
            this._userSessionService.setUserInfo(userInfo);
          },
          error: (err) => {
            console.error('Error obteniendo info del usuario:', err);
          }
        });

        this._router.navigate([`${R_DASHBOARD}`]);
      },
      error: (error: any) => {
        Notiflix.Notify.failure('Error de autenticación. Verifique sus credenciales.');
        console.error('Error en login:', error);
        Notiflix.Loading.remove();
      },
      complete: () => Notiflix.Loading.remove()
    });
  }

  onSubmit() {
  }
}
