import { Component, input } from '@angular/core';
import { testrunnerDetails } from '../../services/details.service';
import { formatSeconds } from '../../../shared/services/time.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-detail',
  imports: [NgClass],
  template: `
    <div class="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">
          Testrunner-{{ testrunnerDetailData().id }}
        </h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Informationen zu
          {{
            testrunnerDetailData().name.charAt(0).toUpperCase() +
              testrunnerDetailData().name.slice(1)
          }}
        </p>
      </div>

      <!-- Übersichtskarten mit aktuellen Daten -->
      <div>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <!-- Statuskarte -->
          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">
              Runner Status
            </dt>
            <dd
              class="mt-1 text-3xl font-semibold tracking-tight"
              [ngClass]="{
                'text-blue-600':
                  testrunnerDetailData().status.toLowerCase() === 'idle',
                'text-green-600':
                  testrunnerDetailData().status.toLowerCase() === 'running',
                'text-red-600':
                  testrunnerDetailData().status.toLowerCase() === 'error'
              }"
            >
              {{ testrunnerDetailData().status }}
            </dd>
          </div>

          <!-- Letzter Heartbeat -->
          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">
              Letztes Update
            </dt>
            <dd
              class="mt-1 text-3xl font-semibold tracking-tight text-gray-900"
            >
              {{ testrunnerDetailData().last_heartbeat }}
            </dd>
          </div>

          <!-- Letzte Rückmeldung -->
          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">
              Letzte Update Message
            </dt>
            <dd
              class="mt-1 text-2xl font-semibold tracking-tight text-gray-900"
            >
              {{ testrunnerDetailData().last_feedback }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Detailinformationen -->
      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <!-- Name -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">ID</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().name }}
            </dd>
          </div>

          <!-- Aktiver Test -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Test</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().active_test }}
            </dd>
          </div>

          <!-- Registrierungszeitpunkt -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">
              Registrierungszeit
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().start_time }}
            </dd>
          </div>

          <!-- Laufzeit -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Laufzeit</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().elapsed_seconds }}
            </dd>
          </div>

          <!-- Plattform -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Plattform</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().platform.join(', ') }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  `,
  styles: ``,
})
export class DetailComponent {
  /** Erwartete Input-Daten mit Testrunner-Details */
  testrunnerDetailData = input.required<testrunnerDetails>();

  /** Optional nutzbare Formatierungsfunktion */
  formatSeconds = formatSeconds;
}
