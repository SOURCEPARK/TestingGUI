import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TestListService {
  private readonly http = inject(HttpClient);

  /** 🔄 Ruft die vollständige Liste aller Tests vom Backend ab */
  getTests(): Observable<TestListElement[]> {
    return this.http
      .get<TestApiResponse[]>('/api/test')
      .pipe(map((tests) => tests.map((t) => this.apiToElement(t))));
  }

  /** 💓 Ruft den aktuellen Status (Heartbeat) eines Tests ab */
  fetchStatus(id: string): Observable<PartialTestUpdate> {
    return this.http.get<PartialTestUpdate[]>(`/api/test/${id}/status`).pipe(
      map((arr) => arr[0]) // Das Backend liefert ein Array mit genau einem Objekt zurück
    );
  }

  /** 🔁 Startet einen bestimmten Test neu */
  restartTest(id: string): Observable<void> {
    return this.http.post<void>(`/api/test/${id}/restart`, {});
  }

  /** ❌ Löscht einen Test */
  deleteTest(id: string): Observable<void> {
    return this.http.delete<void>(`/api/test/${id}`);
  }

  /** 🔁 Löst das Neuladen der Testdefinitionen aus (z. B. aus dem Dateisystem) */
  reloadTestPlans(): Observable<ReloadResponse> {
    return this.http.post<ReloadResponse>('/api/test/reload', {});
  }

  /** 🕒 Ruft den Zeitpunkt des letzten Reloads von Testplänen ab */
  getLastReload(): Observable<string> {
    return this.http
      .get<{ last_reload: string }>('/api/test/last-reload')
      .pipe(map((arr) => arr?.last_reload ?? ''));
  }

  /** ⏸ Pausiert einen laufenden Test */
  pauseTest(id: string): Observable<void> {
    return this.http.get<void>(`/api/test/${id}/stop`, {});
  }

  /** ▶️ Setzt einen pausierten Test fort */
  resumeTest(id: string): Observable<void> {
    return this.http.get<void>(`/api/test/${id}/resume`, {});
  }

  /* --------------------- Mappings & Hilfsmethoden --------------------- */

  /** 🔧 Wandelt die API-Antwort in das Anzeigeformat für die Tabelle um */
  private apiToElement(t: TestApiResponse): TestListElement {
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      testRunner: t.testRunner,
      lastPing: this.formatUnix(t.lastHeartbeat),
      progress: t.progress,
    };
  }

  /** 🕓 Wandelt einen UNIX-Zeitstempel in eine lesbare Zeitangabe um */
  private formatUnix(timestamp: string | null | undefined): string {
    if (!timestamp) return 'Unbekannt';

    const now = Date.now(); // Aktuelle Zeit in ms
    const ts = Number(timestamp); // Timestamp als Zahl
    const diffSeconds = (now - ts) / 1000;

    if (diffSeconds < 60) return `vor ${Math.round(diffSeconds)} Sekunden`;
    if (diffSeconds < 3600)
      return `vor ${Math.round(diffSeconds / 60)} Minuten`;
    if (diffSeconds < 86400)
      return `vor ${Math.round(diffSeconds / 3600)} Stunden`;
    return `vor ${Math.round(diffSeconds / 86400)} Tagen`;
  }
}

export interface TestListElement {
  id: string; // Eindeutige Test-ID
  name: string; // Anzeigename des Tests
  status: string; // Status: running, failed, paused etc.
  testRunner: string; // Zugehöriger Testrunner
  lastPing: string; // Letztes Lebenszeichen (formatiert)
  progress: number; // Fortschritt in %
}

export interface TestApiResponse {
  id: string;
  name: string;
  status: string;
  testRunner: string;
  progress: number;
  lastHeartbeat: string; // Zeitstempel in Millisekunden (oder ISO-Format)
}

export interface PartialTestUpdate {
  id: string;
  status?: string;
  progress?: number;
  last_message?: string;
}

export interface ReloadResponse {
  success: boolean;
  message: string;
  updated: string[]; // Erfolgreich neu geladene Tests
  failed: string[]; // Tests, bei denen das Laden fehlgeschlagen ist
  timestamp: string; // Zeitpunkt des Reloads
}
