import pool from '../config/db.js';

const seed = async () => {
  await pool.query(`DELETE FROM action_logs`);
  await pool.query(`DELETE FROM tests`);
  await pool.query(`DELETE FROM available_tests`);
  await pool.query(`DELETE FROM test_runners`);

  await pool.query(`
    INSERT INTO test_runners (id, name, status, platform, last_heartbeat)
    VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Runner-A', 'IDLE', ARRAY['linux', 'x86_64'], EXTRACT(EPOCH FROM now())::BIGINT),
      ('22222222-2222-2222-2222-222222222222', 'Runner-B', 'RUNNING', ARRAY['windows', 'x86'], EXTRACT(EPOCH FROM now() - interval '30 seconds')::BIGINT)
  `);

  await pool.query(`
    INSERT INTO available_tests (id, name)
    VALUES
      ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Login Functionality Test'),
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'API Load Test'),
      ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Frontend UI Test')
  `);

  await pool.query(`
    INSERT INTO tests (
      id, name, status, test_runner_id, progress,
      testrun_id, start_time, last_reload, elapsed_seconds,
      error_code, error_text, report, description
    ) VALUES
      (
        'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1',
        'Login Functionality Test', 'COMPLETED', '11111111-1111-1111-1111-111111111111',
        100.0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        now() - interval '2 minutes', now(), 120.0,
        NULL, NULL,
        'Login test passed. All steps successful.',
        'Tests login on Chrome with valid credentials.'
      ),
      (
        'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2',
        'API Load Test', 'RUNNING', '22222222-2222-2222-2222-222222222222',
        65.5, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        now() - interval '1 minute', now(), 60.0,
        NULL, NULL, NULL,
        'Running performance test with simulated traffic.'
      ),
      (
        'f3f3f3f3-f3f3-4f3f-f3f3-f3f3f3f3f3f3',
        'Frontend UI Test', 'FAILED', '11111111-1111-1111-1111-111111111111',
        20.0, 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        now() - interval '5 minutes', now(), 45.0,
        'UI404', 'Element not found: submit button',
        'Error occurred at step 3: Missing element',
        'Verifies the visibility and flow of login form on Firefox.'
      );
  `);

  console.log('Seed erfolgreich ausgeführt.');
  await pool.end();
};

seed().catch(err => {
  console.error('Fehler beim Seeding:', err);
  pool.end();
});
