import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule, CurrencyPipe} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-car-shop',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    CommonModule
  ],
  templateUrl: './car-shop.component.html',
  styleUrl: './car-shop.component.scss'
})
export class CarShopComponent {
  private _product: any;
  cantidad: number = 1;
  usarPrecioMayorista: boolean = false;

  @Output() agregarCotizacion = new EventEmitter<any>();

  @Input()
  set product(value: any) {
    this._product = value;
    this.cantidad = 1;
    this.usarPrecioMayorista = false;
  }

  get product() {
    return this._product;
  }

  cotizar() {
    const precio = this.usarPrecioMayorista ? this.product.precioMayorista : this.product.pvp;
    const total = this.cantidad * precio;
    const item = {
      ...this.product,
      cantidad: this.cantidad,
      precio: precio,
      total: total
    };
    this.agregarCotizacion.emit(item);
    this.cantidad = 1;
  }
}
