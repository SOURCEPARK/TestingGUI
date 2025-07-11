import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-navigation',
  imports: [RouterModule],
  template: `
    <div class="flex bg-white h-full w-full">
      <div class="flex flex-col w-full">
        <!-- Hauptbereich der Navigation -->
        <div
          class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6"
        >
          <!-- Logo oben -->
          <div class="flex h-16 shrink-0 items-center pt-4">
            <img
              class="h-11 w-auto m-auto object-contain"
              src="assets/images/logo.png"
              alt="Your Company"
            />
          </div>

          <hr />

          <!-- Navigationslinks -->
          <nav class="flex flex-1 flex-col">
            <ul
              role="list"
              class="flex flex-1 justify-between flex-col gap-y-7"
            >
              <li>
                <ul role="list" class="-mx-2 space-y-1">
                  <!-- Link zu "Tests" -->
                  <li>
                    <a
                      [routerLink]="['tests']"
                      routerLinkActive="bg-gray-50 text-mhd border-l-4 border-mhd"
                      class="text-gray-700 hover:text-mhd hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold cursor-pointer"
                    >
                      Tests
                    </a>
                  </li>

                  <!-- Link zu "Testrunner" -->
                  <li>
                    <a
                      [routerLink]="['/testrunner']"
                      routerLinkActive="bg-gray-50 text-mhd border-l-4 border-mhd"
                      class="text-gray-700 hover:text-mhd hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold cursor-pointer"
                    >
                      Testrunner
                    </a>
                  </li>

                  <!-- Hier könnten weitere Navigationspunkte ergänzt werden -->
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class SideNavigationComponent {
  // Keine zusätzliche Logik notwendig – alles wird rein über Template geregelt
}
