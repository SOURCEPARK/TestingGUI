import { Resolve } from '@angular/router';
import { testrunnerListElement, TestrunnerListSerivce } from '../services/list.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestrunnerListResolver implements Resolve<testrunnerListElement[]> {
  private testrunnerListService = inject(TestrunnerListSerivce);

  resolve() {
    return this.testrunnerListService.getTestrunners();
  }
}
