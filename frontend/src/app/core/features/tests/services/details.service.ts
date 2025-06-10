import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class TestDetailSerivce {
  private readonly http = inject(HttpClient);

  getTestDetails(id: string): Observable<testDetails> {
    return this.http.get<any[]>(`/api/test/${id}`).pipe(
      tap(console.log), // zeigt das ganze Array in der Konsole
      map((dataArray) => {
        const data = dataArray[0]; // Nur das erste Element extrahieren
        return {
          id: data.id,
          name: data.name,
          status: data.status,
          testrunner: data.test_runner_id,
          progress: data.progress,
          startTime: new Date(data.start_time),
          elapsedSeconds: data.elapsed_seconds,
          errorCode: data.error_code,
          errorText: data.error_text,
          report: data.report,
          description: data.description,
          lastReload: new Date(data.last_reload),
          testrunId: data.testrun_id,
          last_message: data.last_message,
        };
      })
    );
  }
}

export interface testDetails {
  id: string;
  name: string;
  status: string;
  testrunner: string;
  progress: number;
  startTime: Date;
  elapsedSeconds: number;
  errorCode: string | null;
  errorText: string | null;
  report: string;
  description: string;
  lastReload: Date;
  testrunId: string;
  last_message: string;
}
