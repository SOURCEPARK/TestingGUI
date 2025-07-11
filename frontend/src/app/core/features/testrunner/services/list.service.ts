import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class TestrunnerListSerivce {
  // HTTP-Client wird per Injection bereitgestellt
  private readonly http = inject(HttpClient);

  /**
   * Ruft alle registrierten Testrunner vom Server ab und
   * transformiert die Rohdaten in ein UI-freundliches Format.
   */
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

  /**
   * Sendet ein Heartbeat-Signal für einen spezifischen Testrunner.
   * Diese Funktion wird z. B. durch UI-Interaktion ausgelöst.
   */
  triggerHeartbeat(id: string): Observable<void> {
    return this.http.post<void>(`/api/test-runner/${id}/heartbeat`, {});
  }

  /**
   * Wandelt einen Zeitstempel (als String im UNIX-Format in ms)
   * in eine menschenlesbare relative Zeitangabe um.
   */
  private formatUnix(timestamp: string): string {
    if (!timestamp) return 'Unbekannt';
    const now = Date.now(); // aktuelle Zeit in Millisekunden
    const ts = Number(timestamp); // Zeitstempel als Zahl
    const diffSeconds = (now - ts) / 1000;

    if (diffSeconds < 60) return `vor ${Math.round(diffSeconds)} Sekunden`;
    if (diffSeconds < 3600)
      return `vor ${Math.round(diffSeconds / 60)} Minuten`;
    return `vor ${Math.round(diffSeconds / 3600)} Stunden`;
  }
}
export interface testrunnerListElement {
  id: string; // Eindeutige ID des Testrunners
  name: string; // Anzeigename
  status: string; // Aktueller Status (z. B. "idle", "running")
  platform: string[]; // Unterstützte Plattformen
  lastHeartbeat: string; // Zeitangabe in relativer Form (z. B. "vor 5 Minuten")
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
