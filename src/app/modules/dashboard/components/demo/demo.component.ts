import { Component, OnInit } from '@angular/core';
import { ApplicationBase } from '../../../utils/base/application.base';
import { DemoDialogComponent } from './demo-dialog/demo-dialog.component';
import { MatDialog } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { Router } from "@angular/router";
import { R_AUTHENTICATION, R_LOGIN } from "../../../../constants/route.constants";

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent extends ApplicationBase implements OnInit {

  public messages!: any;
  public lenguage!: string;

  constructor(private _matDialog: MatDialog,
              private _router: Router,
              private _translate: TranslateService) {
    super();
  }

  ngOnInit() {
    this.lenguage = this._translate.currentLang;
    this.getDataByTranslation();
  }

  public invokeSpinner(): void {
    this.spinner.start();
    setTimeout(() => this.spinner.stop(), 1000);
  }

  public openDemoDialog(): void {
    const dialogRef = this._matDialog.open(DemoDialogComponent, {
      data: {
        title: 'Title',
        body: 'Information'
      }
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) {
        return;
      }
    });
  }

  public invokeToaster(): void {
    this.alertify.success('Exito');
    this.alertify.error('Error');
  }

  public invokeAlert(): void {
    this.alertify.alert('Alerta', 'Mesaje alerta', () => {
      this.invokeToaster();
    });
  }

  public invokeConfirm(): void {
    this.alertify.confirm('Confirmacion', 'Mesaje confirmacion',
      () => this.alertify.success('Accion ok'),
      () => this.alertify.error('Accion cancel'));
  }

  public changeLanguageEN(): void {
    this.lenguage = 'en' !== this.lenguage ? 'en' : 'es';
    this._translate.use(this.lenguage).subscribe(() => this.getDataByTranslation());
  }

  public getDataByTranslation(): void {
    this._translate.get('actionButtons').subscribe((messages: any) => {
      this.messages = messages;
    });
  }

  public logout(): void {
    sessionStorage.clear();
    this._router.navigate([`${R_AUTHENTICATION}/${R_LOGIN}`])
  }
}
