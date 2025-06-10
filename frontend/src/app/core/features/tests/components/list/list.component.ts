import {
  Component,
  inject,
  input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faFilter,
  faMars,
  faVenus,
  faVenusMars,
  faArrowUp,
  faArrowDown,
  faArrowsRotate,
  faWavePulse,
  faTrash,
  faRabbitRunning,
  faXmark,
  faCircleCheck,
} from '@fortawesome/pro-solid-svg-icons';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TestListElement, TestListService } from '../../services/list.service';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmComponent } from '../../../shared/components/confirm/confirm.component';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-list',
  imports: [FontAwesomeModule, RouterLink, NgClass],
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
          class="cursor-pointer block rounded-md bg-mhd px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-mhd/80"
        >
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
          <tr class="hover:bg-gray-100" [routerLink]="[test.id]">
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
              {{ test.name }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <span
                class="inline-flex items-center gap-2"
                [ngClass]="{
                  ' text-red-600 ': test.status === 'Failed',
                  ' text-green-600 ': test.status === 'Running',
                  ' text-blue-600': test.status === 'Completed'
                }"
              >
                <fa-icon [icon]="getStatusIcon(test.status)" class="text-xs" />
                {{ test.status }}
              </span>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
              {{ test.testrunner }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {{ test.lastPing }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {{ test.progress }}%
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm flex gap-2">
              <button
                class="text-orange-600 hover:text-orange-800"
                (click)="onHeartbeatClicked($event, test.id)"
              >
                <fa-icon [icon]="icons.heartBeat" size="lg"></fa-icon>
              </button>
              <button
                class="text-orange-600 hover:text-orange-800"
                (click)="onRefreshClicked($event, test.id)"
              >
                <fa-icon [icon]="icons.arrowsRotate" size="lg"></fa-icon>
              </button>
              <button
                class="text-orange-600 hover:text-orange-800"
                (click)="onDeleteClicked($event, test.id)"
              >
                <fa-icon [icon]="icons.xMark" size="lg"></fa-icon>
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

  /* --------------- Lifecycle --------------- */
  ngOnInit(): void {
    const initial = this.route.snapshot.data['tests'] as
      | TestListElement[]
      | undefined;
    this.tests.set(initial ?? []);

    this.loadLastReload();
  }

  lastReload = signal<string>('');

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
    if (!ok) return;

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
    if (!ok) return;

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

    this.svc.reloadTestPlans().subscribe({
      next: (res) => {
        res.updated.forEach((entry) => {
          this.toast.show(`✅ Erfolgreich aktualisiert: ${entry}`, 'success');
        });
        res.failed.forEach((entry) => {
          this.toast.show(`❌ Fehler bei: ${entry}`, 'error');
        });

        // Aktualisiere lastReload mit timestamp aus der Antwort
        this.lastReload.set(res.timestamp);
      },
      error: (err) => {
        console.error('Fehler beim Testplan-Reload', err);
        this.toast.show('Fehler beim Testplan-Reload', 'error');
      },
    });
  }

  /* -------------- Helper ------------------- */
  private async openConfirmDialog(text: string): Promise<boolean> {
    const ref = this.dialog.open<boolean>(ConfirmComponent, {
      data: { confirmText: text },
      width: '400px',
    });
    const result = await firstValueFrom(ref.closed);
    return result || false;
  }

  getStatusIcon(status: string): IconDefinition {
    console.log('status', status);
    switch (status) {
      case 'Running':
        return this.icons.rabbitRunning;
      case 'Failed':
        return this.icons.xMark;
      case 'Completed':
        return this.icons.circleCheck;
      default:
        return this.icons.trash;
    }
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

  /* -------------- Icons -------------------- */
  icons = {
    filter: faFilter,
    arrowRight: faArrowRight,
    arrowLeft: faArrowLeft,
    arrowUp: faArrowUp,
    arrowDown: faArrowDown,
    arrowsRotate: faArrowsRotate,
    heartBeat: faWavePulse,
    rabbitRunning: faRabbitRunning,
    xMark: faXmark,
    circleCheck: faCircleCheck,
    trash: faTrash,
    male: faMars,
    female: faVenus,
    diverse: faVenusMars,
  };
}
