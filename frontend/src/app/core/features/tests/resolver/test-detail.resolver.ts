import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { testDetails, TestDetailSerivce } from '../services/details.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestDetailResolver implements Resolve<testDetails> {
  // Service injizieren, der die Test-Details vom Backend abruft
  private testDetailService = inject(TestDetailSerivce);

  /**
   * Wird vom Angular-Router aufgerufen, bevor die Route aktiviert wird.
   * Liest die Test-ID aus der URL und liefert ein Observable mit den Test-Details.
   */
  resolve(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id') || '';
    return this.testDetailService.getTestDetails(id);
  }
}
