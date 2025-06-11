import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import {
  testrunnerDetails,
  TestrunnerDetailSerivce,
} from '../services/details.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestrunnerDetailResolver implements Resolve<testrunnerDetails> {
  private testrunnerDetailService = inject(TestrunnerDetailSerivce);

  resolve(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id') || '';
    return this.testrunnerDetailService.getTestrunnerDetails(id);
  }
}
