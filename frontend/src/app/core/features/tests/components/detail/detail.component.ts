import { Component, input } from '@angular/core';
import { testDetails } from '../../services/details.service';
import { formatSeconds } from '../../../shared/services/time.service';
import { NgClass } from '@angular/common';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-detail',
  imports: [NgClass, MarkdownPipe],
  template: `
    <!-- Gesamtlayout für die Testdetailanzeige -->
    <div class="mx-auto max-w-7xl py-4 sm:px-6 lg:px-8">
      <!-- Kopfbereich mit Titel -->
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ testDetailData().name }}
        </h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          Informationen zu Test {{ testDetailData().name }}
        </p>
      </div>

      <!-- Übersichtskarten für Status und Fortschritt -->
      <div>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <!-- Statusanzeige -->
          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">
              Test Status
            </dt>
            <dd
              class="mt-1 text-3xl font-semibold tracking-tight"
              [ngClass]="{
                'text-red-600':
                  testDetailData().status.toLowerCase() === 'failed',
                'text-green-600':
                  testDetailData().status.toLowerCase() !== 'failed',
                'text-yellow-600':
                  testDetailData().status.toLowerCase() === 'paused',
                'text-blue-600':
                  testDetailData().status.toLowerCase() === 'completed'
              }"
            >
              {{ testDetailData().status }}
            </dd>
          </div>

          <!-- Fortschrittsanzeige -->
          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">Progress</dt>
            <dd
              class="mt-1 text-3xl font-semibold tracking-tight text-gray-900"
            >
              {{ testDetailData().progress + ' %' }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Detaillierte Informationen als Definition List -->
      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Letztes Update</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().last_message }}
            </dd>
          </div>

          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Name</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().name }}
            </dd>
          </div>

          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Testrunner</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().testrunner }}
            </dd>
          </div>

          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Startzeit</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().startTime }}
            </dd>
          </div>

          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Ausführungszeit</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ formatSeconds(testDetailData().elapsedSeconds) }}
            </dd>
          </div>

          <!-- Markdown-basierte Beschreibung -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">
              Testbeschreibung
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              <article
                class="prose prose-sm max-w-none"
                [innerHTML]="testDetailData().description || '' | markdown"
              ></article>
            </dd>
          </div>

          <!-- Markdown-formatierter Bericht -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Bericht</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().report || '' | markdown }}
            </dd>
          </div>

          <!-- Fehlercode (falls vorhanden) -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Error</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().errorCode }}
            </dd>
          </div>

          <!-- Fehlermeldung (falls vorhanden) -->
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Errormessage</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testDetailData().errorText }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  `,
  styles: ``,
})
export class DetailComponent {
  // Bindet die vom Resolver oder Aufrufer übergebenen Testdaten
  testDetailData = input.required<testDetails>();

  // Funktion zur Formatierung von Sekunden in lesbare Zeit
  formatSeconds = formatSeconds;
}
