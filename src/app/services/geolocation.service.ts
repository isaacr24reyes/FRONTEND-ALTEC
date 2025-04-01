import { Injectable } from "@angular/core";
import { lastValueFrom, Observable } from "rxjs";
import { GeolocationModel } from "../models/geolocation.model";
import { ApplicationBaseService } from "../modules/utils/base/application-base-service";

@Injectable({
  providedIn: 'root'
})
export class GeolocationService extends ApplicationBaseService {

  private geolocation!: GeolocationModel;

  getGeolocationApi(): Observable<GeolocationModel> {
    return this.genericSend('get');
  }

  setGeolocation(geolocation: GeolocationModel): void {
    this.geolocation = geolocation
  }

  async getGeolocation(): Promise<GeolocationModel> {
    if (!this.geolocation)
      await lastValueFrom(this.getGeolocationApi()).then((resp: GeolocationModel) => this.geolocation = resp)
    return this.geolocation;
  }

}
