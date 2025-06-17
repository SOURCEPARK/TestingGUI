import pool from '../config/db.js';

const seed = async () => {
  try {
    await pool.query(`TRUNCATE TABLE action_logs, tests, available_tests, test_runners RESTART IDENTITY CASCADE`);

    // 1. available_tests einfügen
    // await pool.query(`
    //   INSERT INTO available_tests (id, name, path, description)
    //   VALUES
    //     ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Login Functionality Test', '/k8s/TP', 'Test description'),
    //     ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'API Load Test', '/k8s/TP', 'Test description'),
    //     ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Frontend UI Test', '/k8s/TP', 'Test description')
    // `);

    // 2. test_runners ohne active_test
    await pool.query(`
      INSERT INTO test_runners (
        id, name, status, platform, last_heartbeat,
        last_feedback, last_update,
        elapsed_seconds, start_time
      )
      VALUES 
        (
          '11111111-1111-1111-1111-111111111111',
          'Runner-A',
          'IDLE',
          ARRAY['vagrant', 'k8s'],
          EXTRACT(EPOCH FROM now())::BIGINT,
          'All good',
          now() - interval '10 minutes',
          0,
          now() - interval '15 minutes',
          'http://simpletestrunner:8082'
        ),
        (
          '22222222-2222-2222-2222-222222222222',
          'Runner-B',
          'RUNNING',
          ARRAY['k8s', 'docker'],
          EXTRACT(EPOCH FROM now() - interval '30 seconds')::BIGINT,
          'Processing test',
          now() - interval '2 minutes',
          123.45,
          now() - interval '5 minutes',
          'http://simpletestrunner:8082'
        )
    `);

    // 3. tests ohne test_runner_id
    await pool.query(`
      INSERT INTO tests (
        id, name, status, progress, testrun_id, start_time, last_reload,
        elapsed_seconds, error_code, error_text, report, description, last_message
      ) VALUES
        (
          'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1',
          'Login Functionality Test', 'Completed',
          100.0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          now() - interval '2 minutes', now(), 120.0,
          NULL, NULL,
          'Login test passed. All steps successful.',
          'Tests login on Chrome with valid credentials.',
          'last step completed'
        ),
        (
          'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2',
          'API Load Test', 'Running',
          65.5, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          now() - interval '1 minute', now(), 60.0,
          NULL, NULL, NULL,
          'Running performance test with simulated traffic.',
          'first step completed'
        ),
        (
          'f3f3f3f3-f3f3-4f3f-f3f3-f3f3f3f3f3f3',
          'Frontend UI Test', 'Failed',
          20.0, 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          now() - interval '5 minutes', now(), 45.0,
          'UI404', 'Element not found: submit button',
          'Error occurred at step 3: Missing element',
          'Verifies the visibility and flow of login form on Firefox.',
          '6th step completed'
        )
    `);

    // 4. tests mit test_runner_id aktualisieren
    await pool.query(`
      UPDATE tests SET test_runner_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1';
      UPDATE tests SET test_runner_id = '22222222-2222-2222-2222-222222222222' WHERE id = 'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2';
      UPDATE tests SET test_runner_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'f3f3f3f3-f3f3-4f3f-f3f3-f3f3f3f3f3f3';
    `);

    // 5. test_runners mit active_test aktualisieren
    await pool.query(`
      UPDATE test_runners SET active_test = 'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1' WHERE id = '11111111-1111-1111-1111-111111111111';
      UPDATE test_runners SET active_test = 'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2' WHERE id = '22222222-2222-2222-2222-222222222222';
    `);

    console.log('Seed erfolgreich ausgeführt.');
  } catch (err) {
    console.error('Fehler beim Seeding:', err);
  } finally {
    await pool.end();
  }
};

seed();
