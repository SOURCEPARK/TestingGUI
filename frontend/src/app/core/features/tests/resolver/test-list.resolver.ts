import { Resolve } from '@angular/router';
import { TestListElement, TestListService } from '../services/list.service';
import { inject, Injectable } from '@angular/core';

@Injectable()
export class TestsListResolver implements Resolve<TestListElement[]> {
  private readonly svc = inject(TestListService);
  resolve() {
    return this.svc.getTests();
  }
}
