import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Container für alle aktiven Toasts -->
    <div class="toast-container">
      <!-- Jeder Toast wird abhängig vom Typ eingefärbt -->
      <div class="toast" *ngFor="let toast of toasts()" [ngClass]="toast.type">
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [
    `
      /* Positionierung des Toast-Containers oben rechts im Viewport */
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1000;
      }

      /* Grundlayout jedes Toast-Elements */
      .toast {
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        color: white;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: fadein 0.3s ease-out;
      }

      /* Farben je nach Toast-Typ */
      .success {
        background-color: #16a34a; /* grün */
      }

      .error {
        background-color: #dc2626; /* rot */
      }

      .info {
        background-color: #2563eb; /* blau */
      }

      .warning {
        background-color: #d97706; /* orange */
      }

      /* Einfache Einblend-Animation */
      @keyframes fadein {
        from {
          opacity: 0;
          transform: translateY(-10%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  // Zugriff auf den ToastService
  private toastService = inject(ToastService);

  // Reaktive Liste aller Toast-Nachrichten (Signal)
  toasts = computed(() => this.toastService.toasts());
}
