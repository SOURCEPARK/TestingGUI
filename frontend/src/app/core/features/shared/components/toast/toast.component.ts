import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div class="toast" *ngFor="let toast of toasts()" [ngClass]="toast.type">
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1000;
      }

      .toast {
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        color: white;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: fadein 0.3s ease-out;
      }

      .success {
        background-color: #16a34a;
      }

      .error {
        background-color: #dc2626;
      }

      .info {
        background-color: #2563eb;
      }

      .warning {
        background-color: #d97706;
      }

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
  private toastService = inject(ToastService);
  toasts = computed(() => this.toastService.toasts());
}
