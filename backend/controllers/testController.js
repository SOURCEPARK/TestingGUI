import db from '../config/db.js';

let lastReloadTimestamp = new Date().toISOString();
const createActionResponse = (code, message) => ({ code, message });

export const getTests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(
      `SELECT tests.id, tests.name, tests.status, tests.test_runner_id AS "testRunner", test_runners.last_heartbeat AS "lastHeartbeat", tests.progress
        FROM tests
        LEFT JOIN test_runners ON tests.test_runner_id = test_runners.id
        ORDER BY tests.id
        LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTestById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json(createActionResponse(400, "Missing test ID."));

  try {
    const result = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json(createActionResponse(404, "Test not found"));
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const startTest = async (req, res) => {
  const { testId, testRunnerId } = req.body;
  if (!testId || !testRunnerId) {
    return res.status(400).json(createActionResponse(400, "Missing testId or testRunnerId."));
  }

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [testId]);
    const runnerResult = await db.query('SELECT * FROM test_runners WHERE id = $1', [testRunnerId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json(createActionResponse(404, `Test ${testId} not found.`));
    }
    if (runnerResult.rows.length === 0) {
      return res.status(404).json(createActionResponse(404, `Runner ${testRunnerId} not found.`));
    }

    const runner = runnerResult.rows[0];
    if (runner.status === 'RUNNING') {
      return res.status(409).json(createActionResponse(409, `${runner.name} is busy.`));
    }
    if (runner.status === 'ERROR') {
      return res.status(409).json(createActionResponse(409, `${runner.name} is not available.`));
    }

    await db.query('UPDATE tests SET status = $1, test_runner = $2 WHERE id = $3', ['RUNNING', testRunnerId, testId]);
    await db.query('UPDATE test_runners SET status = $1 WHERE id = $2', ['RUNNING', testRunnerId]);

    res.status(200).json(createActionResponse(200, `Test ${testId} started with runner ${testRunnerId}`));
  } catch (error) {
    console.error(error);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const deleteTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json(createActionResponse(400, "Missing test ID."));

  try {
    const result = await db.query('DELETE FROM tests WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(createActionResponse(200, `Test ${id} deleted.`));
    } else {
      res.status(404).json(createActionResponse(404, "Test not found"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const restartTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json(createActionResponse(400, "Missing test ID."));

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json(createActionResponse(404, "Test not found"));
    }

    await db.query(`
      UPDATE tests SET status = 'Pending', progress = 0, start_time = NULL, elapsed_seconds = 0
      WHERE id = $1
    `, [id]);

    console.log(`Test ${id} restart requested.`);
    res.status(200).json(createActionResponse(200, `Test ${id} is restarting.`));
  } catch (error) {
    console.error(error);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const getTestStatus = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json(createActionResponse(400, "Missing test ID."));

  try {
    const result = await db.query('SELECT status, progress FROM tests WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      const { status, progress } = result.rows[0];
      res.status(200).json(createActionResponse(200, `Status of test ${id}: ${status}, Progress: ${progress}%`));
    } else {
      res.status(404).json(createActionResponse(404, "Test not found"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const getAvailableTests = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM available_tests');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const getAvailableRunners = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json(createActionResponse(400, "Missing test ID."));

  try {
    const testResult = await db.query('SELECT id FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json(createActionResponse(404, "Test ID not found"));
    }

    const runnerResult = await db.query(`
      SELECT id, name FROM test_runners WHERE status NOT IN ('ERROR', 'RUNNING')
    `);

    res.status(200).json(runnerResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(createActionResponse(500, "Database error"));
  }
};

export const reloadTests = (req, res) => {
  console.log("Test reload from GitHub.");
  // TODO: git pull / fetch logic
  res.status(200).json(createActionResponse(200, `Test plans reloaded. Last reload: ${lastReloadTimestamp}`));
};

export const getLastReload = async (req, res) => {
  const result = await db.query('SELECT id, name, last_reload FROM tests');
  res.status(200).json(result.rows);
};