import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info') {
    const id = ++this.counter;
    const toast: ToastMessage = { id, message, type };
    this._toasts.update((prev) => [...prev, toast]);

    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number) {
    this._toasts.update((prev) => prev.filter((t) => t.id !== id));
  }
}
