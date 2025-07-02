import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { TestListElement, TestListService } from '../../services/list.service';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmComponent } from '../../../shared/components/confirm/confirm.component';
import { firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-list',
  imports: [RouterLink, NgClass, NgIf],
  template: `<div
    id="testrunner-list"
    class="flex flex-col h-full px-4 sm:px-6 lg:px-8"
  >
    <!-- Header -->

    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          Tests ({{ tests().length }})
        </h1>
        <p class="mt-2 text-sm text-gray-700">Übersicht aller Tests.</p>
        <div class="mt-2 text-sm text-gray-500">
          {{ formatReloadTime(lastReload()) || 'Nicht geladen' }}
        </div>
      </div>
      <div class="mt-4 sm:mt-0 sm:flex-none flex items-center gap-2">
        <button
          id="new-client-button"
          (click)="onLoadTestDefinitionsClicked()"
          class="flex items-center gap-2 cursor-pointer rounded-md bg-mhd px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mhd/80"
        >
          <svg
            *ngIf="isLoadingDefinitions()"
            class="animate-spin h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
            ></path>
          </svg>
          Testpläne Laden
        </button>
        <button
          id="new-client-button"
          [routerLink]="['start-test']"
          class="cursor-pointer block rounded-md bg-mhd px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-mhd/80"
        >
          Test erstellen
        </button>
      </div>
    </div>

    <!-- Liste -->
    <div class="flex-1 overflow-y-auto mt-4">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Name
            </th>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Status
            </th>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Testrunner
            </th>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Letztes Update
            </th>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Progress
            </th>
            <th
              class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          @for(test of tests();track test){
          <tr class="hover:bg-gray-100 cursor-pointer" [routerLink]="[test.id]">
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
              {{ test.name }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <span
                class="inline-flex items-center gap-2"
                [ngClass]="{
                  ' text-red-600 ': test.status.toLowerCase() === 'failed',
                  ' text-green-600 ': test.status.toLowerCase() === 'running',
                  ' text-blue-600': test.status.toLowerCase() === 'completed',
                  ' text-yellow-600': test.status.toLowerCase() === 'paused'
                }"
              >
                {{ test.status }}
              </span>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
              {{ test.testRunner }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {{ test.lastPing }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {{ test.progress }}%
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm flex gap-2">
              @if(test.status.toLowerCase() === 'running'){
              <button
                class="text-orange-600 hover:text-orange-800 cursor-pointer"
                (click)="onPauseClicked($event, test.id)"
                aria-label="Pause"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M10 9v6m4-6v6"
                  />
                </svg>
              </button>
              }

              <!-- Resume (nur wenn Paused) -->
              @if(test.status.toLowerCase() === 'paused'){
              <button
                class="text-orange-600 hover:text-orange-800 cursor-pointer"
                (click)="onResumeClicked($event, test.id)"
                aria-label="Resume"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.25 15.25L18 12l-3.75-3.25M6 18V6"
                  />
                </svg>
              </button>
              }

              <button
                class="text-orange-600 hover:text-orange-800 cursor-pointer"
                (click)="onHeartbeatClicked($event, test.id)"
                aria-label="Heartbeat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 13h2l3 6 4-12 3 6h4"
                  />
                </svg>
              </button>

              <!-- Restart (RE) – jetzt mit kreisenden Pfeilen -->
              <button
                class="text-orange-600 hover:text-orange-800 cursor-pointer"
                (click)="onRefreshClicked($event, test.id)"
                aria-label="Restart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.5 12a7.5 7.5 0 111.93 5.007"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.5 16.5v-4h4"
                  />
                </svg>
              </button>

              <!-- Delete (DEL) -->
              <button
                class="text-orange-600 hover:text-orange-800 cursor-pointer"
                (click)="onDeleteClicked($event, test.id)"
                aria-label="Löschen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  </div>`,
  styles: ``,
})
export class TestsListComponent implements OnInit {
  /* ---------------- Signale ---------------- */
  tests: WritableSignal<TestListElement[]> = signal<TestListElement[]>([]);

  /* --------------- DI & Services ----------- */
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly svc = inject(TestListService);
  private readonly destroyRef = inject(DestroyRef);

  /* --------------- Lifecycle --------------- */
  ngOnInit(): void {
    const initial = this.route.snapshot.data['tests'] as
      | TestListElement[]
      | undefined;
    this.tests.set(initial ?? []);

    this.loadLastReload();

    this.startPolling();
  }

  lastReload = signal<string>('');
  isLoadingDefinitions = signal(false);

  private loadLastReload(): void {
    this.svc.getLastReload().subscribe({
      next: (val) => this.lastReload.set(val),
      error: (err) => {
        console.error('Fehler beim Laden von last-reload', err);
        this.lastReload.set('Fehler beim Laden');
      },
    });
  }

  /* --------------- Aktionen ---------------- */
  async onHeartbeatClicked(e: Event, id: string): Promise<void> {
    e.stopPropagation();
    this.toast.show('Heartbeat wird angefordert …', 'success');

    try {
      const update = await firstValueFrom(this.svc.fetchStatus(id));
      this.tests.update((arr) =>
        arr.map((t) =>
          t.id === id
            ? {
                ...t,
                status: update.status ?? t.status,
                progress: update.progress ?? t.progress,
                // Optional: weitere Felder wie last_message anzeigen/speichern
              }
            : t
        )
      );
    } catch (err) {
      console.error('Heartbeat-Abruf fehlgeschlagen', err);
      this.toast.show('Heartbeat fehlgeschlagen', 'error');
    }
  }

  async onRefreshClicked(e: Event, id: string): Promise<void> {
    e.stopPropagation();

    const ok = await this.openConfirmDialog('Test wirklich neustarten?');
    console.log(ok);

    const returnValue = ok as any;
    console.log('Dialog returned:', returnValue.confirmed);
    if (returnValue.confirmed == false) return;

    try {
      this.toast.show('Test wird neu gestartet …', 'success');
      await firstValueFrom(this.svc.restartTest(id));
      this.toast.show(
        'Restart erfolgreich. Status wird aktualisiert …',
        'success'
      );

      // Danach Heartbeat laden:
      const update = await firstValueFrom(this.svc.fetchStatus(id));
      this.tests.update((arr) =>
        arr.map((t) =>
          t.id === id
            ? {
                ...t,
                status: update.status ?? t.status,
                progress: update.progress ?? t.progress,
              }
            : t
        )
      );
    } catch (err) {
      console.error('Restart fehlgeschlagen', err);
      this.toast.show('Restart oder Statusabruf fehlgeschlagen', 'error');
    }
  }

  async onDeleteClicked(e: Event, id: string): Promise<void> {
    e.stopPropagation();

    const ok = await this.openConfirmDialog('Test wirklich abbrechen/löschen?');
    console.log(ok);

    const returnValue = ok as any;
    console.log('Dialog returned:', returnValue.confirmed);
    if (returnValue.confirmed == false) return;

    try {
      await firstValueFrom(this.svc.deleteTest(id));
      this.toast.show('Test wurde gelöscht', 'success');

      // Test aus Liste entfernen
      this.tests.update((arr) => arr.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Löschen fehlgeschlagen', err);
      this.toast.show('Löschen fehlgeschlagen', 'error');
    }
  }

  onLoadTestDefinitionsClicked() {
    this.toast.show('Lade Testpläne …', 'info');
    this.isLoadingDefinitions.set(true); // ➤ Spinner anzeigen

    this.svc.reloadTestPlans().subscribe({
      next: (res) => {
        res.updated.forEach((entry) => {
          this.toast.show(`✅ Erfolgreich aktualisiert: ${entry}`, 'success');
        });
        res.failed.forEach((entry) => {
          this.toast.show(`❌ Fehler bei: ${entry}`, 'error');
        });

        this.lastReload.set(res.timestamp);
      },
      error: (err) => {
        console.error('Fehler beim Testplan-Reload', err);
        this.toast.show('Fehler beim Testplan-Reload', 'error');
      },
      complete: () => {
        this.isLoadingDefinitions.set(false); // ➤ Spinner wieder aus
      },
    });
  }

  /* -------------- Helper ------------------- */
  private async openConfirmDialog(text: string) {
    const ref = this.dialog.open<boolean>(ConfirmComponent, {
      data: { confirmText: text },
      width: '400px',
    });
    const result = await firstValueFrom(ref.closed);
    console.log('Dialog closed with:', result);
    return result || false;
  }

  formatReloadTime(timestamp: string | null | undefined): string {
    if (!timestamp) return 'unbekannt';
    const date = new Date(timestamp);
    return `Letztes Laden der Testpläne: ${date.toLocaleString('de-DE', {
      weekday: 'short', // z. B. "Di."
      year: 'numeric',
      month: 'long', // z. B. "Juni"
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  private startPolling(): void {
    interval(10_000) // alle 10 000 ms
      .pipe(
        startWith(0), // sofort einmal feuern
        switchMap(() => this.svc.getTests()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => this.tests.set(list));
  }

  async onPauseClicked(e: Event, id: string): Promise<void> {
    e.stopPropagation();

    try {
      await firstValueFrom(this.svc.pauseTest(id));
      this.toast.show('Test pausiert', 'info');
      this.reloadTestsFromBackend();
    } catch (err) {
      console.error('Pausieren fehlgeschlagen', err);
      this.toast.show('Pausieren fehlgeschlagen', 'error');
    }
  }

  async onResumeClicked(e: Event, id: string): Promise<void> {
    e.stopPropagation();

    try {
      await firstValueFrom(this.svc.resumeTest(id));
      this.toast.show('Test fortgesetzt', 'info');
      this.reloadTestsFromBackend();
    } catch (err) {
      console.error('Fortsetzen fehlgeschlagen', err);
      this.toast.show('Fortsetzen fehlgeschlagen', 'error');
    }
  }

  private reloadTestsFromBackend(): void {
    this.svc.getTests().subscribe({
      next: (list) => this.tests.set(list),
      error: (err) => {
        console.error('Fehler beim Nachladen der Tests', err);
        this.toast.show('Fehler beim Neuladen der Testdaten', 'error');
      },
    });
  }
}
