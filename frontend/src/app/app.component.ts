import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './core/features/layout/components/layout/layout.component';
import { ToastContainerComponent } from './core/features/shared/components/toast/toast.component';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, ToastContainerComponent],
  template: `<div class="h-full w-full">
    <app-toast-container /><app-layout />
  </div>`,
  styles: ``,
})
export class AppComponent {
  title = 'test-suite';
}
