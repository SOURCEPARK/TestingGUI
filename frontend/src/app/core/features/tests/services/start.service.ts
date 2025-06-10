import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class TestStartSerivce {
  private readonly http = inject(HttpClient);

  getAvailableTests(): Observable<availableTest[]> {
    return this.http.get<any[]>('/api/test/available-tests').pipe(
      map((tests) =>
        tests.map((t) => ({
          id: t.id,
          name: t.name,
        }))
      )
    );
  }
}

export interface availableTest {
  id: string;
  name: string;
}
