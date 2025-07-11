import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-confirm',
  imports: [],
  template: `
    <!-- Halbtransparenter Hintergrund -->
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>

    <!-- Zentrale Modaldarstellung -->
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <!-- Titelbereich -->
        <div class="flex items-start">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ data.confirmText }}
            </h3>
          </div>
        </div>

        <!-- Aktions-Buttons -->
        <div class="mt-4 flex justify-end gap-2">
          <!-- Abbrechen-Button → schließt mit false -->
          <button
            (click)="close(false)"
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Abbrechen
          </button>

          <!-- Bestätigen-Button → schließt mit true -->
          <button
            (click)="close(true)"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class ConfirmComponent {
  // Referenz auf den Dialog, um ihn programmatisch schließen zu können
  private dialogRef = inject(DialogRef<{ confirmed: boolean | null }>);

  // Injected Daten vom Aufrufer des Dialogs (z. B. Bestätigungstext)
  data = inject(DIALOG_DATA) as { confirmText: string };

  /**
   * Schließt den Dialog und übergibt, ob bestätigt wurde
   * @param confirmed true = bestätigt, false = abgebrochen
   */
  close(confirmed: boolean): void {
    console.log('close called with:', confirmed);
    this.dialogRef.close({ confirmed });
  }
}
