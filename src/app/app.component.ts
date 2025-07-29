import { Component } from '@angular/core';
import {LoaderService} from "./shared/services/LoaderService";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'base_angular';
  constructor(public loaderService: LoaderService) {}
}
