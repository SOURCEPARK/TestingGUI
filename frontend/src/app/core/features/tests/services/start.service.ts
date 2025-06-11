import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TestStartService {
  private readonly http = inject(HttpClient);

  /** Liste aller verfügbaren Tests */
  getAvailableTests(): Observable<AvailableTest[]> {
    return this.http
      .get<any[]>('/api/test/available-tests')
      .pipe(
        map((tests) =>
          tests.map((t) => ({ id: t.id, name: t.name } satisfies AvailableTest))
        )
      );
  }

  /** Runner für eine konkrete Test-ID */
  getRunnersForTest(testId: string): Observable<TestRunner[]> {
    return this.http
      .get<any[]>(`/api/test-runner/${testId}/available`)
      .pipe(
        map((runners) =>
          runners.map((r) => ({ id: r.id, name: r.name } satisfies TestRunner))
        )
      );
  }

  /** Test starten  */
  startTest(testId: string, testRunnerId: string): Observable<void> {
    return this.http.post<void>('/api/test/start', {
      testId,
      testRunnerId,
    });
  }
}

/* ---------- Typen ---------- */
export interface AvailableTest {
  id: string;
  name: string;
}

export interface TestRunner {
  id: string;
  name: string;
}
