# API Routen Dokumentation - Test
---

Diese Routen sind für die Verwaltung von Tests in der Testing GUI-Applikation vorgesehen.
 * Sie verwalten Vorgänge wie das Abrufen, Starten, Stoppen und Neustarten von Tests,
 * sowie die Verwaltung von Test Runners und verfügbaren Tests.

Die Routen sind verfügbar unter `http://localhost:3000/test`

Methode | Routen	| Beschreibungen
-|-|-
GET    | /                | Gibt eine paginierte Liste von Tests zurück
GET    | /:id             | Gibt detaillierte Informationen über einen bestimmten Test anhand seiner ID zurück
GET    | /:id/status      | Gibt aktuellen Teststatus zurück
GET    | /:id/runners     | Gibt eine Liste der verfügbaren Test Runner zurück, <font color=orange>TODO: die die gleiche Plattform haben wie der Testplan gefordert.</font>
GET    | /:id/stop        | Stoppt einen bestimmten Test
GET    | /:id/resume      | Fortsetzen eines bestimmten Tests
GET    | /available-tests | Gibt eine Liste der verfügbaren Tests zurück
GET    | /last-reload     | Gibt den Zeitstempel des letzten Neuladens zurück
POST   | /reload          | Lädt Testdeskriptoren von GitHub neu
POST   | /start           | Startet einen Test
POST   | /:id/restart     | Startet einen Test neu
DELETE | /:id             | Löscht einen Test


### 1. Eine paginierte Liste von Tests empfangen
- **Endpoint**: GET `/`
- **Beschreibung**: Gibt eine paginierte Liste von Tests zurück.
- **Query Parameter**: 
    - `page`: Seitenzahl für die Paginierung (Standardwert ist 1).
    - `limit`: Anzahl der Tests pro Seite (Standardwert: 10000).
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "5e1b7d6e-3896-484d-b594-759c0bb20495",
            "testPlanId": "f58419c4-ceb0-4e4a-a435-3a6142791f8e",
            "testRunId": "55d6fe76-5156-4a34-9be8-ce487570481c",
            "name": "TP-00001-EZDX-F-00001",
            "status": "PASSED",
            "testRunner": "11111111-1111-1111-1111-111111111111",
            "lastHeartbeat": "1751657378286",
            "progress": 1
        }
    ]
    ```

### 2. Einen bestimmten Test anhand seiner ID empfangen
- **Endpoint**: GET `/:id`
- **Beschreibung**: Gibt detaillierte Informationen über einen bestimmten Test anhand seiner ID zurück.
- **Path Parameter**: Die ID des Tests
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "5e1b7d6e-3896-484d-b594-759c0bb20495",
            "name": "TP-00001-EZDX-F-00001",
            "status": "RUNNING",
            "test_runner_id": "11111111-1111-1111-1111-111111111111",
            "progress": 0.5,
            "testrun_id": "823094b6-e2b1-4fbc-8fe3-bf716b9277bc",
            "start_time": "2025-07-04T21:09:48.000Z",
            "elapsed_seconds": 16,
            "error_code": null,
            "error_text": null,
            "report": "Test finished",
            "description": "Abracadabra",
            "last_message": "Test läuft",
            "test_plan_id": "f58419c4-ceb0-4e4a-a435-3a6142791f8e",
            "platform": "k8s",
            "url": "https://abracadabra"
        }
    ]
    ```
    
### 3. Aktuellen Teststatus empfangen
- **Endpoint**: GET `/:id/status`
- **Beschreibung**: Gibt aktuellen Teststatus zurück.
- **Path Parameter**: Die ID des Tests.
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "5e1b7d6e-3896-484d-b594-759c0bb20495",
            "status": "RUNNING",
            "progress": 0.5,
            "last_message": "Test läuft"
        }
    ]
    ```

### 4. Eine Liste der verfügbaren Test Runner erhalten
- **Endpoint**: GET `/:id/runners`
- **Beschreibung**: Gibt eine Liste der verfügbaren Test Runner zurück, <font color=orange>TODO: die die gleiche Plattform haben wie der Testplan gefordert.</font>
- **Path Parameter**: Die ID des Testplans
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    {
        "message": "example",
        "runners":[{
                "id": "11111111-1111-1111-1111-111111111111",
                "name": "11111111-1111-1111-1111-111111111111"
            }
        ]
    }
    ```
    
### 5. Einen Test stoppen
- **Endpoint**: GET `/:id/stop`
- **Beschreibung**: Stoppt einen bestimmten Test und sendet eine Stoppanforderung an TestRunner, der den angegebenen Test ausführt
- **Path Parameter**: Die ID des Tests.
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    "Test: 5e1b7d6e-3896-484d-b594-759c0bb20495 mit testRunId: c97096f4-c8fb-402a-bb3b-28597906645f gestoppt."
    ```
    
### 6. Einen gestoppten Test fortsetzen
- **Endpoint**: GET `/:id/resume`
- **Beschreibung**: Setzt einen angehaltenen Test fort und sendet die Fortsetzung an den TestRunner, der den angegebenen Test ausführt - wenn der Test angehalten wurde.
- **Path Parameter**: Die ID des Tests.
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    "Test: 5e1b7d6e-3896-484d-b594-759c0bb20495 mit testRunId: c97096f4-c8fb-402a-bb3b-28597906645f gestoppt."
    ```
    
### 7. Eine Liste der verfügbaren Tests empfangen
- **Endpoint**: GET `/available-tests`
- **Beschreibung**: Gibt eine Liste der verfügbaren Tests zurück
- **Path Parameter**: None
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "f58419c4-ceb0-4e4a-a435-3a6142791f8e",
            "name": "TP-00001-EZDX-F-00001",
            "last_reload": "2025-07-02T21:00:35.480Z",
            "descriptor": "{\"testdescriptor\":{\"platforms\":[\"k8s\"],\"testplan\":\"https://gitlab...\"}",
            "description": "Abracadabra",
            "platform": "k8s"
        }
    ]
    ```
    
### 8. Den Zeitstempel des letzten Neuladens empfangen
- **Endpoint**: GET `/last-reload`
- **Beschreibung**: Gibt den Zeitstempel des letzten Neuladens zurück
- **Path Parameter**: None
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    {
        "last_reload": "2025-07-02T21:00:38.743Z"
    }
    ```
    
### 9. Testdeskriptoren von GitHub neu laden
- **Endpoint**: POST `/reload`
- **Beschreibung**: Lädt Testdeskriptoren von GitHub neu
- **Path Parameter**: None
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    {
        "success": true,
        "message": "Descriptor reload completed",
        "updated": [
            "TP-00000-XXXX-F-00000",
            "TP-00000-XXXX-F-00001",
            "TP-00000-XXXX-F-00002",
        ],
        "failed": [],
        "deleted": [],
        "timestamp": "2025-07-04T21:51:25.443Z"
    }
    ```
    
### 10. Einen Test starten
- **Endpoint**: POST `/start`
- **Beschreibung**: startet einen Test.
- **Path Parameter**: None
- **Request Body**: Der Request Body muss leer sein.
    ```json
    {
        "testId": "f58419c4-ceb0-4e4a-a435-3a6142791f8e",
        "testRunnerId": "11111111-1111-1111-1111-111111111111"
    }
    ```
    - Hinweis: Die `testId` bezeichnet hier die `testPlanId`.
- **Response**:
    ```json
    {
        "testRunId": "55d6fe76-5156-4a34-9be8-ce487570481c",
        "message": "TestID: 5e1b7d6e-3896-484d-b594-759c0bb20495 erfolgreich gestartet mit testPlanID f58419c4-ceb0-4e4a-a435-3a6142791f8e auf Runner 11111111-1111-1111-1111-111111111111."
    }
    ```
    
### 11. Einen Test neu starten
- **Endpoint**: POST `/:id/restart`
- **Beschreibung**: Startet einen Test neu.
- **Path Parameter**: Die ID des Tests.
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    {
        "testId": "5e1b7d6e-3896-484d-b594-759c0bb20495",
        "testPlanId": "f58419c4-ceb0-4e4a-a435-3a6142791f8e",
        "testRunId": "c97096f4-c8fb-402a-bb3b-28597906645f",
        "message": "Test plan mit neuen test run ID c97096f4-c8fb-402a-bb3b-28597906645f wurde neu gestartet."
    }
    ```
    - Hinweis: Nachdem Neustarten bekommt der Test eine neue `testRunId`.
    
### 12. Einen Test löschen
- **Endpoint**: DELETE `/:id`
- **Beschreibung**: Löscht einen Test.
- **Path Parameter**: Die ID des Tests.
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    "Test: 5e1b7d6e-3896-484d-b594-759c0bb20495 mit testRunId: c97096f4-c8fb-402a-bb3b-28597906645f gelöscht. Test runner 11111111-1111-1111-1111-111111111111 wieder verfügbar."
    ```