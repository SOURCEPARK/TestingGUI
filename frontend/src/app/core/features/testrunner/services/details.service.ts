import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TestrunnerListResponse } from './list.service';
import { map, tap } from 'rxjs';

@Injectable()
export class TestrunnerDetailSerivce {
  // HTTP-Client zum Abrufen von Daten via REST API
  private readonly http = inject(HttpClient);

  /**
   * Lädt die Detailinformationen eines Testrunners anhand seiner ID.
   * Die Antwortdaten werden über ein Mapping transformiert.
   */
  getTestrunnerDetails(id: string) {
    return this.http.get<testrunnerDetails>(`/api/test-runner/${id}`).pipe(
      tap(console.log), // loggt die vollständige Response zu Debugzwecken
      map((runner) => ({
        id: runner.id,
        name: runner.name,
        status: runner.status,
        platform: runner.platform,
        last_heartbeat: this.formatUnix(runner.last_heartbeat), // wird in lesbare Zeitangabe übersetzt
        last_feedback: runner.last_feedback,
        last_update: runner.last_update,
        active_test: runner.active_test,
        elapsed_seconds: runner.elapsed_seconds,
        start_time: runner.start_time,
        url: runner.url,
      }))
    );
  }

  /**
   * Konvertiert einen Unix-Timestamp (in ms) in eine menschenlesbare
   * relative Zeitangabe wie „vor 3 Minuten“ oder „vor 2 Stunden“.
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

export interface testrunnerDetails {
  id: string; // Eindeutige ID des Testrunners
  name: string; // Name des Testrunners
  status: string; // Aktueller Status (z. B. "idle", "running")
  platform: string[]; // Liste unterstützter Plattformen (z. B. ["linux", "mac"])
  last_heartbeat: string; // Zeitpunkt des letzten „Heartbeats“ (vom Backend als UNIX Timestamp geliefert)
  last_feedback?: string; // Letzte Rückmeldung des Testrunners
  last_update?: string; // Zeitpunkt des letzten Updates
  active_test?: string; // Aktuell laufender Test (falls vorhanden)
  elapsed_seconds?: string; // Gesamtlaufzeit seit Start (falls vorhanden)
  start_time?: string; // Startzeitpunkt des Testrunners (falls vorhanden)
  url: string; // Remote-URL oder Zugriffspunkt
}
