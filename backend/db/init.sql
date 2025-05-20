CREATE TABLE tests (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    test_runner_id UUID REFERENCES test_runners(id),
    start_time TIMESTAMP,
    last_reload TIMESTAMP,
    elapsed_seconds FLOAT,
    error_code TEXT,
    error_text TEXT,
    report TEXT,
    description TEXT
);

CREATE TABLE test_runners (
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

CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES tests(id),
    runner_id UUID REFERENCES test_runners(id),
    code INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);