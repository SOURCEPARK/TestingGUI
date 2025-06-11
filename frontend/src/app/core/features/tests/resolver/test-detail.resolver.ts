import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { testDetails, TestDetailSerivce } from '../services/details.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestDetailResolver implements Resolve<testDetails> {
  private testDetailService = inject(TestDetailSerivce);

  resolve(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id') || '';
    return this.testDetailService.getTestDetails(id);
  }
}
