import { Injectable, signal } from '@angular/core';

// Mögliche Typen von Toast-Benachrichtigungen
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Struktur eines Toasts
export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // Reaktives Signal mit allen aktuellen Toast-Nachrichten
  private _toasts = signal<ToastMessage[]>([]);

  // Interner Zähler zur Vergabe eindeutiger IDs
  private counter = 0;

  // Readonly-Zugriff für Konsumenten (z. B. die Komponente)
  readonly toasts = this._toasts.asReadonly();

  /**
   * Zeigt eine neue Toast-Nachricht an
   * @param message – der Nachrichtentext
   * @param type – Typ des Toasts (standard: 'info')
   */
  show(message: string, type: ToastType = 'info') {
    const id = ++this.counter;
    const toast: ToastMessage = { id, message, type };

    // Neue Nachricht ans Ende der Liste anhängen
    this._toasts.update((prev) => [...prev, toast]);

    // Nach 3 Sekunden automatisch ausblenden
    setTimeout(() => this.dismiss(id), 3000);
  }

  /**
   * Entfernt einen Toast anhand seiner ID
   * @param id – ID des Toasts
   */
  dismiss(id: number) {
    this._toasts.update((prev) => prev.filter((t) => t.id !== id));
  }
}
