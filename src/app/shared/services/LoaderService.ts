import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  isLoading$ = new BehaviorSubject<boolean>(false);
  progress$ = new BehaviorSubject<number>(0);
  private interval: any;

  start() {
    this.isLoading$.next(true);
    this.progress$.next(0);
    this.interval = setInterval(() => {
      if (this.progress$.value < 90) {
        this.progress$.next(this.progress$.value + 5);
      }
    }, 300);
  }

  finish() {
    clearInterval(this.interval);
    this.progress$.next(100);
    setTimeout(() => {
      this.isLoading$.next(false);
    }, 300);
  }
}
