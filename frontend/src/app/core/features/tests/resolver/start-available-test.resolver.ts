import { Resolve } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { AvailableTest, TestStartService } from '../services/start.service';

@Injectable()
export class AvailableTestResolver implements Resolve<AvailableTest[]> {
  // Service zur Bereitstellung von Testdefinitionen injizieren
  private testStartService = inject(TestStartService);

  /**
   * Diese Methode wird automatisch vom Angular-Router aufgerufen,
   * bevor die Route geladen wird.
   * Sie liefert eine Liste verfügbarer Tests als Observable.
   */
  resolve() {
    return this.testStartService.getAvailableTests();
  }
}
