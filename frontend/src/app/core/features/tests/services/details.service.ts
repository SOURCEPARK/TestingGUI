import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable()
export class TestDetailSerivce {
  private readonly http = inject(HttpClient);

  /**
   * 🔍 Holt die Detailinformationen zu einem bestimmten Test.
   * Die API liefert ein Array mit einem einzelnen Eintrag – es wird das erste Element extrahiert.
   *
   * @param id Die ID des Tests
   * @returns Ein Observable mit den Testdetails
   */
  getTestDetails(id: string): Observable<testDetails> {
    return this.http.get<any[]>(`/api/test/${id}`).pipe(
      tap(console.log), // gibt die Rohdaten zur Fehleranalyse in der Konsole aus
      map((dataArray) => {
        const data = dataArray[0]; // Extrahiert das erste (und einzige) Element

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
  id: string; // Eindeutige ID des Tests
  name: string; // Anzeigename des Tests
  status: string; // Aktueller Status (z. B. running, failed, completed, paused)
  testrunner: string; // Zugewiesener Testrunner (ID)
  progress: number; // Fortschritt in Prozent
  startTime: Date; // Startzeit als JavaScript Date-Objekt
  elapsedSeconds: number; // Dauer seit Start in Sekunden
  errorCode: string | null; // Fehlercode, falls vorhanden
  errorText: string | null; // Fehlermeldung, falls vorhanden
  report: string; // Bericht im Markdown- oder Textformat
  description: string; // Beschreibung des Tests (z. B. aus Testdefinition)
  lastReload: Date; // Letzter Reload-Zeitpunkt (Date)
  testrunId: string; // ID des übergeordneten Testlaufs
  last_message: string; // Letzte bekannte Systemmeldung / Statusmeldung
}
