import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TestStartService {
  private readonly http = inject(HttpClient);

  /**
   * 📄 Ruft die Liste aller verfügbaren Tests ab, die aktuell gestartet werden können.
   * Jeder Test enthält eine ID, einen Anzeigenamen und eine Beschreibung.
   *
   * @returns Observable mit `AvailableTest[]`
   */
  getAvailableTests(): Observable<AvailableTest[]> {
    return this.http.get<any[]>('/api/test/available-tests').pipe(
      map((tests) =>
        tests.map(
          (t) =>
            ({
              id: t.id,
              name: t.name,
              desc: t.description,
            } satisfies AvailableTest)
        )
      )
    );
  }

  /**
   * 🔍 Ruft die Liste der ausführbaren Testrunner für einen bestimmten Test ab.
   * Diese Runner sind laut Backend kompatibel oder aktiv für die gewählte Testdefinition.
   *
   * @param testId Die ID des gewählten Tests
   * @returns Observable mit `TestRunner[]`
   */
  getRunnersForTest(testId: string): Observable<TestRunner[]> {
    return this.http
      .get<any[]>(`/api/test-runner/${testId}/available`)
      .pipe(
        map((runners) =>
          runners.map((r) => ({ id: r.id, name: r.name } satisfies TestRunner))
        )
      );
  }

  /**
   * ▶️ Startet einen neuen Testlauf mit den gewählten Parametern.
   *
   * @param testId Die ID des ausgewählten Tests
   * @param testRunnerId Die ID des gewählten Testrunners
   * @returns Observable<void> – Erfolgs-/Fehlerstatus
   */
  startTest(testId: string, testRunnerId: string): Observable<void> {
    return this.http.post<void>('/api/test/start', {
      testId,
      testRunnerId,
    });
  }
}

/** Verfügbare Testdefinition für Auswahl im Start-Formular */
export interface AvailableTest {
  id: string; // Technische ID der Testdefinition
  name: string; // Anzeigename
  desc: string; // Beschreibung oder Markdown-Inhalt
}

/** Ein Testrunner, der den Test ausführen kann */
export interface TestRunner {
  id: string; // Eindeutige Runner-ID
  name: string; // Anzeigename oder Maschinenname
}
