import {Component, Inject} from '@angular/core';
import { MAT_DIALOG_DATA,  MatDialogRef} from "@angular/material/dialog";
import {DialogDataModel} from "../../../../utils/models/dialog-data.model";
import {ApplicationBase} from "../../../../utils/base/application.base";

@Component({
  selector: 'app-demo-dialog',
  templateUrl: './demo-dialog.component.html',
  styleUrls: ['./demo-dialog.component.scss']
})
export class DemoDialogComponent extends ApplicationBase {

  constructor(private _dialogRef: MatDialogRef<DemoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public demoDialogData: DialogDataModel) {
    super();
  }

  public close(data?: any): void{
    this._dialogRef.close(data);
  }
}
