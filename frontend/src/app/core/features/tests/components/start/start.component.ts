import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Location } from '@angular/common';
import {
  AvailableTest,
  TestRunner,
  TestStartService,
} from '../../services/start.service';
import { ToastService } from '../../../shared/services/toast.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="forms" class="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">Test Starten</h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Starten Sie einen neuen Test mit einem Testrunner.
        </p>
      </div>

      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <!-- Testdefinition -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Testdefinition</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ng-select
                formControlName="testDefinitionForm"
                [items]="availableTests()"
                bindLabel="name"
                bindValue="id"
                placeholder="Bitte auswählen"
                [searchable]="true"
                notFoundText="Keine Einträge gefunden"
                [clearable]="false"
              ></ng-select>
            </dd>
          </div>

          <!-- Testrunner -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Testrunner</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ng-select
                formControlName="testRunnersForm"
                [items]="runners()"
                bindLabel="name"
                bindValue="id"
                placeholder="Bitte auswählen"
                [searchable]="true"
                notFoundText="Keine Einträge gefunden"
                [clearable]="false"
              ></ng-select>
            </dd>
          </div>
        </dl>

        <!-- Buttons -->
        <div class="flex w-full justify-end gap-2 mt-4">
          <button
            type="button"
            class="cursor-pointer block rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
            (click)="onBackButtonClicked()"
          >
            Abbrechen
          </button>
          <button
            type="button"
            class="cursor-pointer block rounded-md bg-mhd px-3 py-2 text-sm font-semibold text-white hover:bg-mhd/80"
            [disabled]="!canStart()"
            (click)="onStartTestClicked()"
          >
            Test starten
          </button>
        </div>
      </div>
    </form>
  `,
})
export class StartComponent {
  /* DI */
  private readonly svc = inject(TestStartService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);

  /* Signale */
  availableTests = signal<AvailableTest[]>([]);
  runners = signal<TestRunner[]>([]);

  /* Reactive Form */
  forms = new FormGroup({
    testDefinitionForm: new FormControl<string | null>(null),
    testRunnersForm: new FormControl<string | null>({
      value: null,
      disabled: true,
    }),
  });

  constructor() {
    /* 1️⃣ Verfügbare Tests initial laden */
    this.svc.getAvailableTests().subscribe({
      next: (tests) => this.availableTests.set(tests),
      error: () =>
        this.toast.show('Fehler beim Laden der verfügbaren Tests', 'error'),
    });

    /* 2️⃣ Reaktion auf Test-Auswahl – mithilfe von toSignal() */
    const selectedTestId = toSignal(
      this.forms.controls.testDefinitionForm.valueChanges,
      { initialValue: null }
    );

    effect(() => {
      const testId = selectedTestId();
      if (!testId) {
        this.forms.controls.testRunnersForm.disable();
        this.forms.controls.testRunnersForm.reset();
        this.runners.set([]);
        return;
      }

      this.forms.controls.testRunnersForm.enable();
      this.forms.controls.testRunnersForm.reset();

      this.svc.getRunnersForTest(testId).subscribe({
        next: (r) => this.runners.set(r),
        error: () =>
          this.toast.show('Fehler beim Laden der Testrunner', 'error'),
      });
    });
  }

  /* Kann Start-Button aktiv sein? */
  canStart(): boolean {
    const { testDefinitionForm, testRunnersForm } = this.forms.controls;
    return !!testDefinitionForm.value && !!testRunnersForm.value;
  }

  /* Start-Button */
  onStartTestClicked(): void {
    const testId = this.forms.controls.testDefinitionForm.value!;
    const runnerId = this.forms.controls.testRunnersForm.value!;

    this.svc.startTest(testId, runnerId).subscribe({
      next: () => {
        this.toast.show('Test wurde erfolgreich gestartet', 'success');
        this.location.back();
      },
      error: () => this.toast.show('Fehler beim Starten des Tests', 'error'),
    });
  }

  /* Abbrechen-Button */
  onBackButtonClicked(): void {
    this.location.back();
  }
}
