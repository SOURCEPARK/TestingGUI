import db from '../config/db.js';
import axios from 'axios';

//GET paginated list of test runners
export const getAllRunners = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10000;
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

//GET detailed test runner information
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

// GET available runners for test xyz based on its required platform
export const getAvailableRunnerForAvailableTest = async (req, res) => {
  const { id:testId } = req.params;

  if (!testId) {
    return res.status(400).json("Missing testId.");
  }

  try {
    // Plattform des Tests holen
    const testResult = await db.query(
      `SELECT platform FROM available_tests WHERE id = $1`,
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json("Test not found.");
    }

    const platform = testResult.rows[0].platform;

    // Verfügbare Runner mit passender Plattform suchen
    const runnerResult = await db.query(
      `SELECT id, name
       FROM test_runners
       WHERE status = 'IDLE'
         AND $1 = ANY(platform)`,
      [platform]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json("No available runners for this test.");
    }

    res.status(200).json(runnerResult.rows);
  } catch (error) {
    console.error("Error fetching runners for test:", error);
    res.status(500).json("Failed to fetch available runners.");
  }
};

//GET Heartbeat aus DB ans Frontend senden
export const getHeartbeat = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id AS runnerId,
              status,
              last_heartbeat AS timestamp,
              elapsed_seconds AS uptimeSeconds,
              last_feedback,
              last_update,
              platform,
              url
       FROM test_runners
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("Test runner not found");
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching heartbeat:", error);
    res.status(500).json("Failed to fetch heartbeat data.");
  }
};

// POST Heartbeat weiterleiten und prüfen, ob Runner erreichbar ist
export const sendHeartbeat = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json("Test runner not found");
    }

    const runner = result.rows[0];
    const now = new Date();

    try {
      // Anfrage an Testrunner senden
      const response = await axios.get(`${runner.url}/heartbeat`);

      if (response.status === 200) {
        await db.query(
          `UPDATE test_runners
           SET last_heartbeat = $1,
               status = $2,
               last_feedback = $3,
               last_update = $4
           WHERE id = $5`,
          [
            Date.now(),
            'RUNNING',
            'Runner responded to health check.',
            now.toISOString(),
            id
          ]
        );

        console.log(`Runner ${id} is alive.`);
        return res.status(200).json(`Runner ${id} is alive.`);
      }
    } catch (err) {
      // Runner nicht erreichbar
      await db.query(
        `UPDATE test_runners
         SET status = $1,
             last_feedback = $2,
             last_update = $3
         WHERE id = $4`,
        [
          'ERROR',
          'Runner did not respond to health check.',
          now.toISOString(),
          id
        ]
      );

      console.warn(`Runner ${id} is not responding.`);
      return res.status(503).json(`Runner ${id} is not responding.`);
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};

// POST heartbeat to runner
export const receiveHeartbeat = async (req, res) => {
  const { timestamp, runnerId, status, sequence, uptimeSeconds } = req.body;

  if (!timestamp || !runnerId || !status || sequence === undefined) {
    return res.status(400).json("Missing required heartbeat data");
  }

  const currentTs = new Date(timestamp).getTime();
  if (!Number.isFinite(currentTs)) {
    return res.status(400).json("Invalid timestamp.");
  }

  const safeUptime = Number.isFinite(uptimeSeconds) ? uptimeSeconds : 0;

  try {
    const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [runnerId]);

    if (result.rows.length === 0) {
      return res.status(404).json("Test runner not found");
    }

    const runner = result.rows[0];
    const lastHeartbeat = runner.last_heartbeat || 0;

    if (currentTs - lastHeartbeat < 60_000) {
      return res.status(429).json(`Heartbeat too frequent. Wait ${60 - Math.floor((currentTs - lastHeartbeat) / 1000)}s.`);
    }

    await db.query(
      `UPDATE test_runners
       SET last_heartbeat = $1,
           status = $2,
           last_feedback = $3,
           last_update = $4,
           elapsed_seconds = $5
       WHERE id = $6`,
      [
        currentTs,
        status,
        `Heartbeat #${sequence} received.`,
        new Date().toISOString(),
        safeUptime,
        runnerId
      ]
    );

    console.log(`Heartbeat #${sequence} from runner ${runnerId} received.`);
    res.status(200).json(`Heartbeat received for runner ${runnerId}.`);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};

// POST register a new test runner
export const registerRunner = async (req, res) => {
  const { runnerId, url, platforms } = req.body;

  if (!runnerId || !url || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json("Invalid runner data");
  }

  const now = new Date();

  try {
    await db.query(
      `INSERT INTO test_runners (
        id, name, status, platform, url, last_update
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        platform = EXCLUDED.platform,
        url = EXCLUDED.url,
        last_update = EXCLUDED.last_update;`,
      [runnerId, runnerId, 'IDLE', platforms, url, now.toISOString()]
    );

    console.log(`Runner ${runnerId} registered successfully.`);
    res.status(201).json(`Runner ${runnerId} registered or updated successfully.`);
  } catch (error) {
    console.error("Error registering runner:", error);
    res.status(500).json("Failed to register runner.");
  }
};