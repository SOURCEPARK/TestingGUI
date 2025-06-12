import pool from '../config/db.js';

const createSchema = async () => {
  console.log('schema.js wird ausgeführt');

  // available_tests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS available_tests (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      path TEXT,
      description TEXT,
      platform TEXT
    );
  `);

  // tests (noch ohne FK zu test_runners)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50),
      test_runner_id UUID,
      progress FLOAT,
      testrun_id UUID,
      start_time TIMESTAMP,
      last_reload TIMESTAMP,
      elapsed_seconds FLOAT,
      error_code TEXT,
      error_text TEXT,
      report TEXT,
      description TEXT,
      last_message TEXT,
      path TEXT,
      platform TEXT
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
