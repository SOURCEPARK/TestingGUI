import { Resolve } from '@angular/router';
import {
  testrunnerListElement,
  TestrunnerListSerivce,
} from '../services/list.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestrunnerListResolver
  implements Resolve<testrunnerListElement[]>
{
  // Service zum Laden der Testrunner-Liste wird injiziert
  private testrunnerListService = inject(TestrunnerListSerivce);

  /**
   * Resolver-Methode: Lädt die Liste der Testrunner,
   * bevor die Route aktiviert wird.
   * Die Daten stehen dann unter `route.snapshot.data['testrunners']`
   * oder können automatisch in ein `input()` injiziert werden.
   */
  resolve() {
    return this.testrunnerListService.getTestrunners();
  }
}
