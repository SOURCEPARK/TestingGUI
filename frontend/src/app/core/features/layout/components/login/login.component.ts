import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  template: `
    <div
      class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50"
    >
      <!-- Logo + Überschrift -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md h-full">
        <img
          class="mx-auto h-20 w-auto"
          src="assets/images/logo.png"
          alt="Your Company"
        />
        <h2
          class="mt-6 text-center text-xl/9 font-bold tracking-tight text-gray-900"
        >
          Melden Sie sich an der Testing Gui
        </h2>
      </div>

      <!-- Formularfeld -->
      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form class="space-y-6">
            <!-- Benutzername / E-Mail -->
            <div>
              <label
                for="email"
                class="block text-sm/6 font-medium text-gray-900"
              >
                E-Mail Adresse
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  name="login"
                  id="login"
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <!-- Passwort -->
            <div>
              <label
                for="password"
                class="block text-sm/6 font-medium text-gray-900"
              >
                Passwort
              </label>
              <div class="mt-2">
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <!-- Login-Button -->
            <div>
              <button
                type="button"
                (click)="onLogin()"
                class="flex w-full justify-center rounded-md bg-mhd px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-mhd/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Anmelden
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class LoginComponent {
  // Damit das äußere Layout immer volle Höhe bekommt
  @HostBinding('class') class = 'h-full';

  // Wird ausgelöst, sobald Benutzer auf "Anmelden" klickt
  @Output() loggedIn = new EventEmitter<void>();

  /**
   * Simulierter Login-Vorgang — in echter App hier Authentifizierung durchführen
   */
  onLogin(): void {
    this.loggedIn.emit();
  }
}
