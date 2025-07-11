import {
  Component,
  inject,
  input,
  signal,
  OnInit,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  testrunnerListElement,
  TestrunnerListSerivce,
} from '../../services/list.service';
import { firstValueFrom } from 'rxjs';
import { ConfirmComponent } from '../../../shared/components/confirm/confirm.component';
import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [RouterLink, NgClass],
  template: `
    <div id="testrunner-list" class="flex flex-col h-full px-4 sm:px-6 lg:px-8">
      <!-- Überschrift -->
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-base font-semibold text-gray-900">
            Testrunner ({{ testrunners().length }})
          </h1>
          <p class="mt-2 text-sm text-gray-700">Übersicht aller Testrunner.</p>
        </div>
      </div>

      <!-- Tabelle mit allen Testrunner-Einträgen -->
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
                Plattform
              </th>
              <th
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Letzter Heartbeat
              </th>
              <th
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Aktion
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-200">
            @for (testrunner of testrunners(); track testrunner) {
            <tr
              class="hover:bg-gray-100 cursor-pointer"
              [routerLink]="[testrunner.id]"
            >
              <!-- Name -->
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {{ testrunner.name }}
              </td>

              <!-- Status mit farblicher Hervorhebung -->
              <td class="whitespace-nowrap px-3 py-4 text-sm">
                <span
                  class="inline-flex items-center gap-2"
                  [ngClass]="{
                    'text-blue-600': testrunner.status.toLowerCase() === 'idle',
                    'text-green-600':
                      testrunner.status.toLowerCase() === 'running',
                    'text-red-600': testrunner.status.toLowerCase() === 'error'
                  }"
                >
                  {{ testrunner.status }}
                </span>
              </td>

              <!-- Plattformliste -->
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                {{ testrunner.platform.join(', ') }}
              </td>

              <!-- Zeitpunkt des letzten Heartbeats -->
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {{ testrunner.lastHeartbeat }}
              </td>

              <!-- Aktionsbutton zum manuellen Heartbeat -->
              <td class="whitespace-nowrap px-3 py-4 text-sm flex gap-2">
                <button
                  class="text-orange-600 hover:text-orange-800 w-6 h-6"
                  (click)="onHeartbeatClicked($event, testrunner.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
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
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: ``,
})
export class ListComponent implements OnInit {
  // Eingabewert vom Resolver (Initialdaten)
  initialTestrunners = input<testrunnerListElement[]>();

  // Route- und Service-Injektion
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);
  private readonly testrunnerService = inject(TestrunnerListSerivce);

  // Schreibbares Signal für die Tabelle
  testrunners: WritableSignal<testrunnerListElement[]> = signal([]);

  ngOnInit(): void {
    // Über Resolver geladene Daten initial setzen
    const data = this.route.snapshot.data['testrunners'] as
      | testrunnerListElement[]
      | undefined;
    this.testrunners.set(data ?? []);

    // Alle 30 Sekunden neu laden
    setInterval(() => {
      this.reloadTestrunners().catch((err) =>
        console.error('Fehler beim Aktualisieren der Testrunner:', err)
      );
    }, 30000);
  }

  /**
   * Sendet manuell einen Heartbeat für den angegebenen Testrunner
   */
  async onHeartbeatClicked(event: Event, id: string): Promise<void> {
    event.stopPropagation(); // verhindert Navigation beim Button-Klick
    try {
      await firstValueFrom(this.testrunnerService.triggerHeartbeat(id));
      await this.reloadTestrunners();
    } catch (err) {
      console.error('Fehler beim Senden des Heartbeats:', err);
    }
  }

  /**
   * Holt aktuelle Daten vom Server und aktualisiert das Signal
   */
  private async reloadTestrunners(): Promise<void> {
    const data = await firstValueFrom(this.testrunnerService.getTestrunners());
    this.testrunners.set(data);
  }
}
