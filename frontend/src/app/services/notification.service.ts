import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();
  private idCounter = 0;

  show(type: ToastMessage['type'], message: string, durationMs = 5000) {
    const id = this.idCounter++;
    this._toasts.update(current => [...current, { id, type, message }]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  remove(id: number) {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }
}
