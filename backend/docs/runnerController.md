# API Routen Dokumentation - Test Runner
---
Diese Routen sind für die Verwaltung von Test Runners gedacht.
  * Sie bieten Endpunkte zum Abrufen, Registrieren und Aktualisieren von Test Runner,
  * sowie die Verarbeitung von Heartbeats und abgeschlossenen Testberichten.

Die Routen sind verfügbar unter `http://localhost:3000/test-runner`

## Frontend-Facing
Methode | Routen | Beschreibungen
-|-|-
GET | /	| Gibt eine paginierte Liste aller Test Runner zurück
GET	| /:id | Liefert detaillierte Informationen über einen bestimmten Runner
GET | /:id/available | Abfrage nach verfügbaren Runner für einen bestimmten Test auf der erforderlichen Plattform

### 1. GET paginierte Liste von Test Runner
- **Endpoint**: GET `/`
- **Beschreibung**: Gibt eine paginierte Liste aller Test Runner zurück
- **Query Parameter**:
    - `page`: Seitenzahl für die Paginierung (Standardwert ist 1).
    - `limit`: Anzahl der Tests pro Seite (Standardwert: 10000).
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "11111111-1111-1111-1111-111111111111",
            "status": "IDLE",
            "platform": [
                "k8s"
            ],
            "last_heartbeat": "1751527755388",
            "last_feedback": "Runner responded to health check.",
            "last_update": "2025-07-03T07:29:15.385Z",
            "active_test": null,
            "elapsed_seconds": null,
            "start_time": null,
            "url": "http://simpletestrunner:8082"
        }
    ]
    ```
### 2. GET einen bestimmten Test Runner anhand seiner ID
- **Endpoint**: GET `/:id`
- **Beschreibung**: Liefert detaillierte Informationen über einen bestimmten Runner
- **Path Parameter**: Die ID von dem Test Runner
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "11111111-1111-1111-1111-111111111111",
        "status": "IDLE",
        "platform": [
            "k8s"
        ],
        "last_heartbeat": "1751527755388",
        "last_feedback": "Runner responded to health check.",
        "last_update": "2025-07-03T07:29:15.385Z",
        "active_test": null,
        "elapsed_seconds": null,
        "start_time": null,
        "url": "http://simpletestrunner:8082"
    }
    ```

### 3. GET verfügbare Runner für einen bestimmten Test auf der erforderlichen Plattform.
- **Endpoint**: GET `/:id/available`
- **Beschreibung**: Abfrage nach IDLE Runner, die einer Testplattform entsprechen
- **Path Parameter**: Die ID von dem Test Plan
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "11111111-1111-1111-1111-111111111111"
        }
    ]
    ```


## Test Runner von Sourcepark-Facing
Methode | Routen	| Beschreibungen
-|-|-
POST | /register | Registriert einen neuen Test Runner oder aktualisiert einen vorhandenen Test Runner.
POST | /heartbeat/:id | Empfängt einen regelmäßigen Heartbeat von Test Runner und aktualisiert seinen Status in der Datenbank.
POST | /:id/heartbeat | Sendet eine Heartbeat-Anfrage an einen bestimmten Test Runner, um zu prüfen, ob er erreichbar ist, und aktualisiert seinen Status in der Datenbank.
POST | /:testRunId/complete | Empfängt einen abgeschlossenen Testbericht von einem Test Runner und aktualisiert den Teststatus in der Datenbank.

### 1. Einen Test Runner registieren oder updaten
- **Endpoint**: POST `/register`
- **Beschreibung**: Registriert einen neuen Test Runner oder aktualisiert einen vorhandenen Test Runner.
- **Path Parameter**: None
- **Request Body**: 
    ```json
    {
        "runnerId": "11111111-1111-1111-1111-111111111111",
        "url": "http://simpletestrunner:8082",
        "platforms": [
                "k8s"
            ]
    }
    ```
- **Response**:
    ```json
    "Runner 11111111-1111-1111-1111-111111111111 registered or updated successfully."
    ```
### 2. Einen regelmäßigen Heartbeat von Test Runner empfängen
- **Endpoint**: POST `/heartbeat/:id`
- **Beschreibung**: Empfängt einen regelmäßigen Heartbeat von Test Runner und aktualisiert seinen Status in der Datenbank.
- **Path Parameter**: Die ID von dem Test Runner
- **Request Body**: 
    ```json
    {
        "timestamp": "example-ISO-time",
        "status": "RUNNING",
        "sequence": "example",
        "uptimeSeconds": 10.0,
        "testRunId": "11111111-2222-2222-2222-111111111111",
        "testStatus": "RUNNING",
        "progress": 0.5,
        "message": "The test is running",
        "errorcode": null,
        "errortext": null
    }
    ```
- **Response**:
    ```json
    "Heartbeat received for runner 11111111-1111-1111-1111-111111111111."
    ```
### 3. Heartbeat-Anfrage an einen bestimmten Test Runner senden
- **Endpoint**: POST `/:id/heartbeat`
- **Beschreibung**: Sendet eine Heartbeat-Anfrage an einen bestimmten Test Runner, um zu prüfen, ob er erreichbar ist, und aktualisiert seinen Status in der Datenbank.
- **Path Parameter**: Die ID von dem Test Runner
- **Request Body**: Der Request Body muss leer sein.
- **Response**:
    ```json
    "Runner: 11111111-1111-1111-1111-111111111111 is RUNNING."
    ```
### 4. Abgeschlossener Testbericht empfangen
- **Endpoint**: POST `/:testRunId/complete`
- **Beschreibung**: Empfängt einen abgeschlossenen Testbericht von einem Test Runner und aktualisiert den Teststatus in der Datenbank.
- **Path Parameter**: Die ID von dem Test Run
- **Request Body**: 
    ```json
    {
        "report": "Test finished"
    }
    ```
- **Response**:
    ```json
    {
        "message": "Report erfolgreich gespeichert für testRunId 55d6fe76-5156-4a34-9be8-ce487570481c",
        "testId": "5e1b7d6e-3896-484d-b594-759c0bb20495"
    }
    ```
