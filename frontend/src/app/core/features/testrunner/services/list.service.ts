import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class TestrunnerListSerivce {
  private readonly http = inject(HttpClient);

  getTestrunners() {
    return this.http.get<TestrunnerListResponse[]>('/api/test-runner').pipe(
      map((testsRunner) =>
        testsRunner.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          platform: t.platform,
          lastHeartbeat: this.formatUnix(t.last_heartbeat),
        }))
      )
    );
  }

  triggerHeartbeat(id: string): Observable<void> {
    return this.http.post<void>(`/api/test-runner/${id}/heartbeat`, {});
  }

  private formatUnix(timestamp: string): string {
    if (!timestamp) return 'Unbekannt';
    const now = Date.now(); // ms
    const ts = Number(timestamp); // ms
    const diffSeconds = (now - ts) / 1000;

    if (diffSeconds < 60) return `vor ${Math.round(diffSeconds)} Sekunden`;
    if (diffSeconds < 3600)
      return `vor ${Math.round(diffSeconds / 60)} Minuten`;
    return `vor ${Math.round(diffSeconds / 3600)} Stunden`;
  }
}

export interface testrunnerListElement {
  id: string;
  name: string;
  status: string;
  platform: string[];
  lastHeartbeat: string;
}

export interface TestrunnerListResponse {
  id: string;
  name: string;
  status: string;
  platform: string[];
  last_heartbeat: string;
  last_feedback?: string;
  last_update?: string;
  active_test?: string;
  elapsed_seconds?: string;
  start_time?: string;
}
