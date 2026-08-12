import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();
  private idCounter = 0;

  private _alert = signal<AlertOptions | null>(null);
  public readonly activeAlert = this._alert.asReadonly();

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

  alert(options: AlertOptions) {
    this._alert.set({
      title: options.title || (options.type === 'success' ? 'வெற்றி!' : options.type === 'error' ? 'பிழை!' : 'தகவல்'),
      message: options.message,
      type: options.type || 'info',
      confirmText: options.confirmText || 'சரி (OK)',
      onConfirm: options.onConfirm
    });
  }

  confirmAlert() {
    const current = this._alert();
    this._alert.set(null);
    if (current && current.onConfirm) {
      current.onConfirm();
    }
  }
}

