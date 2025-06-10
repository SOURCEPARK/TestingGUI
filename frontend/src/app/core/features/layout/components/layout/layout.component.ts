import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideNavigationComponent } from '../side-navigation/side-navigation.component';
import { LoginComponent } from '../login/login.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [
    FontAwesomeModule,
    SideNavigationComponent,
    LoginComponent,
    RouterModule,
  ],
  template: `
    <div class="flex w-full h-full relative">
      @if(loggedIn) {
      <div
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0"
      >
        <app-side-navigation></app-side-navigation>
      </div>
      <div class="flex-1 p-4 bg-gray-50 pt-8 h-full overflow-y-auto">
        <router-outlet></router-outlet>
      </div>
      } @else {
      <app-login class="w-full" (loggedIn)="userLoggedIn()" />
      }
    </div>
  `,
  styles: ``,
})
export class LayoutComponent {
  loggedIn = true;

  userLoggedIn() {
    this.loggedIn = true;
  }
}
