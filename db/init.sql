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
    description TEXT
);

CREATE TABLE IF NOT EXISTS available_tests (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS test_runners (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    platform TEXT[],
    last_heartbeat BIGINT,
    last_feedback TEXT,
    last_update TIMESTAMP,
    active_test UUID REFERENCES tests(id),
    elapsed_seconds FLOAT,
    start_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id),
    runner_id UUID REFERENCES test_runners(id),
    code INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tests
    ADD CONSTRAINT fk_tests_test_runner
        FOREIGN KEY (test_runner_id)
            REFERENCES test_runners(id);

INSERT INTO test_runners (id, name, status, platform, last_heartbeat)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Runner-A', 'IDLE', ARRAY['linux', 'x86_64'], EXTRACT(EPOCH FROM now())::BIGINT),
  ('22222222-2222-2222-2222-222222222222', 'Runner-B', 'RUNNING', ARRAY['windows', 'x86'], EXTRACT(EPOCH FROM now() - interval '30 seconds')::BIGINT);

INSERT INTO available_tests (id, name)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Login Functionality Test'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'API Load Test'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Frontend UI Test');

INSERT INTO tests (
    id, name, status, test_runner_id, progress,
    testrun_id, start_time, last_reload, elapsed_seconds, error_code, error_text, report, description
)
VALUES
  (
    'd1d1d1d1-d1d1-4d1d-d1d1-d1d1d1d1d1d1',
    'Login Functionality Test',
    'COMPLETED',
    '11111111-1111-1111-1111-111111111111',
    100.0,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now() - interval '2 minutes',
    now(),
    120.0,
    NULL,
    NULL,
    'Login test passed. All steps successful.',
    'Tests login on Chrome with valid credentials.'
  ),
  (
    'e2e2e2e2-e2e2-4e2e-e2e2-e2e2e2e2e2e2',
    'API Load Test',
    'RUNNING',
    '22222222-2222-2222-2222-222222222222',
    65.5,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now() - interval '1 minute',
    now(),
    60.0,
    NULL,
    NULL,
    NULL,
    'Running performance test with simulated traffic.'
  ),
  (
    'f3f3f3f3-f3f3-4f3f-f3f3-f3f3f3f3f3f3',
    'Frontend UI Test',
    'FAILED',
    '11111111-1111-1111-1111-111111111111',
    20.0,
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    now() - interval '5 minutes',
    now(),
    45.0,
    'UI404',
    'Element not found: submit button',
    'Error occurred at step 3: Missing element',
    'Verifies the visibility and flow of login form on Firefox.'
  );