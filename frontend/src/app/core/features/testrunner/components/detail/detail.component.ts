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
      <div>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
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

          <div
            class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt class="truncate text-sm font-medium text-gray-500">
              Letztes Updat Message
            </dt>
            <dd
              class="mt-1 text-2xl font-semibold tracking-tight text-gray-900"
            >
              {{ testrunnerDetailData().last_feedback }}
            </dd>
          </div>
        </dl>
      </div>
      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">ID</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().name }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Test</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().active_test }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">
              Registrierungszeit
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().start_time }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Laufzeit</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().elapsed_seconds }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Plattform</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ testrunnerDetailData().platform.join(', ') }}
            </dd>
          </div>
          <!-- <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900"></dt>
            <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <ul
                role="list"
                class="divide-y divide-gray-100 rounded-md border border-gray-200"
              >
                <li
                  class="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
                >
                  <div class="flex w-0 flex-1 items-center">
                    <svg
                      class="size-5 shrink-0 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="ml-4 flex min-w-0 flex-1 gap-2">
                      <span class="truncate font-medium">Bericht-X.pdf</span>
                      <span class="shrink-0 text-gray-400">2.4mb</span>
                    </div>
                  </div>
                  <div class="ml-4 shrink-0">
                    <a class="font-medium text-indigo-600 hover:text-indigo-500"
                      >Download</a
                    >
                  </div>
                </li>
                <li
                  class="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
                >
                  <div class="flex w-0 flex-1 items-center">
                    <svg
                      class="size-5 shrink-0 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      data-slot="icon"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="ml-4 flex min-w-0 flex-1 gap-2">
                      <span class="truncate font-medium">Bericht-Y.pdf</span>
                      <span class="shrink-0 text-gray-400">4.5mb</span>
                    </div>
                  </div>
                  <div class="ml-4 shrink-0">
                    <a class="font-medium text-indigo-600 hover:text-indigo-500"
                      >Download</a
                    >
                  </div>
                </li>
              </ul>
            </dd>
         </div> -->
        </dl>
      </div>
    </div>
  `,
  styles: ``,
})
export class DetailComponent {
  testrunnerDetailData = input.required<testrunnerDetails>();

  formatSeconds = formatSeconds;
}
