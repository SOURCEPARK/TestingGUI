import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import {
  testrunnerDetails,
  TestrunnerDetailSerivce,
} from '../services/details.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestrunnerDetailResolver implements Resolve<testrunnerDetails> {
  // Dienst zur Abfrage der Detaildaten wird via DI injiziert
  private testrunnerDetailService = inject(TestrunnerDetailSerivce);

  /**
   * Resolver-Methode: wird vor Aktivierung der Route aufgerufen.
   * Lädt die Detaildaten des Testrunners basierend auf der ID in der URL.
   * Rückgabewert ist ein Observable<testrunnerDetails>, das automatisch
   * im Route-Data verfügbar gemacht wird.
   */
  resolve(route: ActivatedRouteSnapshot) {
    // ID aus den Routenparametern auslesen
    const id = route.paramMap.get('id') || '';

    // Details über die ID vom Service laden
    return this.testrunnerDetailService.getTestrunnerDetails(id);
  }
}
