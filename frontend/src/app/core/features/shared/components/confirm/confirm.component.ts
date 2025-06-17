import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-confirm',
  imports: [],
  template: `
    <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>

    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div class="flex items-start">
          <div class="">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ data.confirmText }}
            </h3>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button
            (click)="close(false)"
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Abbrechen
          </button>
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
  private dialogRef = inject(DialogRef<{ confirmed: boolean | null }>);
  data = inject(DIALOG_DATA) as { confirmText: string };

  close(confirmed: boolean): void {
    console.log('close called with:', confirmed);
    this.dialogRef.close({ confirmed });
  }
}
