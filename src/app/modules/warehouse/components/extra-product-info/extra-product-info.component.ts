import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-extra-product-info',
  templateUrl: './extra-product-info.component.html',
  styleUrls: ['./extra-product-info.component.scss']
})
export class ExtraProductInfoComponent {
  @Input() product: any;
}
