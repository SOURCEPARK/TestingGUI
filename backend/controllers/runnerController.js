import db from '../config/db.js';

export const getAllRunners = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT *
      FROM test_runners
      ORDER BY name
      LIMIT $1 OFFSET $2`;

    const { rows } = await db.query(query, [limit, offset]);
    if (rows.length === 0) {
      return res.status(404).json("No test runners found.");
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching test runners:", error);
    res.status(500).json("Failed to retrieve test runners.");
  }
};

export const getRunnerById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json("Test runner not found");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};

export const sendHeartbeat = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json("Test runner not found");
    }

    const runner = result.rows[0];
    const now = new Date();
    const heartbeatTimestamp = Date.now();
    const newStatus = runner.status === 'RUNNING' ? 'RUNNING' : 'IDLE';

    await db.query(`
      UPDATE test_runners
      SET last_heartbeat = $1,
          status = $2,
          last_feedback = $3,
          last_update = $4
      WHERE id = $5
    `, [
      heartbeatTimestamp,
      newStatus,
      'Heartbeat received successfully.',
      now.toISOString(),
      id
    ]);

    console.log(`Heartbeat received from runner ${id}.`);
    res.status(200).json(`Heartbeat acknowledged for runner ${id}.`);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};