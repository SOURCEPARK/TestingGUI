import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TestrunnerListResponse } from './list.service';
import { map, tap } from 'rxjs';

@Injectable()
export class TestrunnerDetailSerivce {
  private readonly http = inject(HttpClient);

  getTestrunnerDetails(id: string) {
    return this.http.get<testrunnerDetails>(`/api/test-runner/${id}`).pipe(
      tap(console.log), // zeigt alle Felder in der Konsole
      map((runner) => ({
        id: runner.id,
        name: runner.name,
        status: runner.status,
        platform: runner.platform,
        last_heartbeat: this.formatUnix(runner.last_heartbeat),
        last_feedback: runner.last_feedback,
        last_update: runner.last_update,
        active_test: runner.active_test,
        elapsed_seconds: runner.elapsed_seconds,
        start_time: runner.start_time,
      }))
    );
  }

  private formatUnix(timestamp: string): string {
    const now = Date.now(); // ms
    const ts = Number(timestamp); // ms
    const diffSeconds = (now - ts) / 1000;

    if (diffSeconds < 60) return `vor ${Math.round(diffSeconds)} Sekunden`;
    if (diffSeconds < 3600)
      return `vor ${Math.round(diffSeconds / 60)} Minuten`;
    return `vor ${Math.round(diffSeconds / 3600)} Stunden`;
  }
}

export interface testrunnerDetails {
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
