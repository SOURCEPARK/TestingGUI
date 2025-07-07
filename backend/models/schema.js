import pool from '../config/db.js';

const createSchema = async () => {
  console.log('schema.js wird ausgeführt');

  // available_tests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS available_tests (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      last_reload TIMESTAMP,
      descriptor TEXT,
      description TEXT,
      platform TEXT
    );
  `);

  // tests (noch ohne FK zu test_runners)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id UUID PRIMARY KEY,                -- Eindeutige ID für diesen konkreten Testlauf (nicht test_plan_id)
      name VARCHAR(255) NOT NULL,         -- Anzeigename des Tests (kommt aus available_tests)
      status VARCHAR(50),                 -- Status des Testlaufs: z.B. "RUNNING", "PASSED", "FAILED", ...
      test_runner_id UUID,                -- Verweis auf den Test Runner, der diesen Test ausführt (FK zur test_runners-Tabelle)
      progress FLOAT,                     -- Fortschritt des Testlaufs in Prozent (z.B. 0.0–100.0)
      testrun_id UUID,                    -- Laufzeit-ID für den Testlauf, kommt vom Testrunner bei Start (API-spezifisch)
      start_time TIMESTAMP,               -- Zeitpunkt des Teststarts
      elapsed_seconds FLOAT,              -- Vergangene Zeit in Sekunden seit Start
      error_code TEXT,                    -- Fehlercode bei Abbruch oder Problemen (z.B. "500", "TIMEOUT", ...)
      error_text TEXT,                    -- Fehlermeldung im Klartext
      report TEXT,                        -- Abschlussbericht des Tests
      description TEXT,                   -- Beschreibung des Tests (kommt z.B. aus README.md von GitHub)
      last_message TEXT,                  -- Letzte vom Testrunner übermittelte Nachricht (z.B. via Heartbeat)
      test_plan_id UUID,                  -- ID des zugehörigen Testplans (kommt aus available_tests, bleibt konstant)
      platform TEXT,                      -- Plattform auf der der Test ausgeführt wird
      url TEXT                            -- URL zum Testplan
    );
  `);

  // test_runners mit FK zu tests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_runners (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50),
      platform TEXT[],
      last_heartbeat BIGINT,
      last_feedback TEXT,
      last_update TIMESTAMP,
      active_test UUID,
      elapsed_seconds FLOAT,
      start_time TIMESTAMP,
      url TEXT
    );
  `);

  // FK test_runner_id nachträglich hinzufügen
  await pool.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name  = 'fk_tests_test_runner'
        ) THEN
            ALTER TABLE tests
            ADD CONSTRAINT fk_tests_test_runner
            FOREIGN KEY (test_runner_id) REFERENCES test_runners(id);
        END IF;
    END $$;
  `);

  // FK active_test nachträglich hinzufügen
  // Diese FK wird gesetzt, wenn ein Test gestartet wird und auf den aktiven Test des Runners verweist
  // und wird auf NULL gesetzt, wenn der Test abgeschlossen ist
  await pool.query(`
  DO $$
  BEGIN
      IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'test_runners_active_test_fkey'
      ) THEN
          ALTER TABLE test_runners
          ADD CONSTRAINT test_runners_active_test_fkey
          FOREIGN KEY (active_test) REFERENCES tests(id)
          ON DELETE SET NULL;
      END IF;
  END $$;
`);

  // action_logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id SERIAL PRIMARY KEY,
      test_id UUID REFERENCES tests(id),
      runner_id UUID REFERENCES test_runners(id),
      code INTEGER,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tabellen erfolgreich erstellt.');
};

createSchema().catch(err => {
  console.error('Fehler beim Erstellen des Schemas:', err);
  pool.end();
});
