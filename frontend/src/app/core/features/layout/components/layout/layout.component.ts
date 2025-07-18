import { Component } from '@angular/core';
import { SideNavigationComponent } from '../side-navigation/side-navigation.component';
import { LoginComponent } from '../login/login.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  // Importiert die notwendigen Komponenten und Routing
  imports: [SideNavigationComponent, LoginComponent, RouterModule],
  template: `
    <div class="flex w-full h-full relative">
      @if(loggedIn) {
      <!-- Wenn der Benutzer eingeloggt ist, Sidebar + Inhaltsbereich anzeigen -->
      <div
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0"
      >
        <app-side-navigation></app-side-navigation>
      </div>

      <div class="flex-1 p-4 bg-gray-50 pt-8 h-full overflow-y-auto">
        <router-outlet></router-outlet>
        <!-- Zeigt aktuelle Route an -->
      </div>
      } @else {
      <!-- Wenn nicht eingeloggt, Login-Formular anzeigen -->
      <app-login class="w-full" (loggedIn)="userLoggedIn()" />
      }
    </div>
  `,
  styles: ``,
})
export class LayoutComponent {
  // Zustand, ob der Benutzer eingeloggt ist oder nicht
  loggedIn = true; // Zur Zeit initial auf true gesetzt, da bisher keine Zugangskontrolle vorgesehen ist

  // Wird vom LoginComponent ausgelöst, sobald Login erfolgreich war
  userLoggedIn() {
    this.loggedIn = true;
  }
}
