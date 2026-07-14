import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private activeRequests = 0;
  isLoading = signal<boolean>(false);

  show() {
    this.activeRequests++;
    this.isLoading.set(true);
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.isLoading.set(false);
    }
  }
}
