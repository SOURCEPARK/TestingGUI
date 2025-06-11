import { Resolve } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { AvailableTest, TestStartService } from '../services/start.service';

@Injectable()
export class AvailableTestResolver implements Resolve<AvailableTest[]> {
  private testStartService = inject(TestStartService);

  resolve() {
    return this.testStartService.getAvailableTests();
  }
}
