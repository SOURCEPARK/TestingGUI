import { Resolve } from '@angular/router';
import { TestListElement, TestListService } from '../services/list.service';
import { inject, Injectable } from '@angular/core';
import { availableTest, TestStartSerivce } from '../services/start.service';

@Injectable()
export class AvailableTestResolver implements Resolve<availableTest[]> {
  private testStartService = inject(TestStartSerivce);

  resolve() {
    return this.testStartService.getAvailableTests();
  }
}
