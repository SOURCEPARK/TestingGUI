import { Resolve } from '@angular/router';
import { TestListElement, TestListService } from '../services/list.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestsListResolver implements Resolve<TestListElement[]> {
  // Injectiere den Service, der die Liste aller Tests vom Backend holt
  private readonly svc = inject(TestListService);

  /**
   * Wird vom Angular-Router vor dem Laden der Route aufgerufen.
   * Holt die Liste aller bekannten Tests aus dem Backend.
   * Gibt ein Observable mit einem Array von TestListElementen zurück.
   */
  resolve() {
    return this.svc.getTests();
  }
}
