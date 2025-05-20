import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import db from '../config/db.js';

dotenv.config();
//const app = express();
const router = express.Router();

//app.use(bodyParser.json());

// --- API Routes ---
// GET /test-runners - Get paginated list of test runners
router.get('/test-runners', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const query = `
      SELECT name, status, platform, last_heartbeat
      FROM test_runners
      ORDER BY name
      LIMIT $1 OFFSET $2`;

        const { rows } = await db.query(query, [limit, offset]);
        if (rows.length === 0) {
            return res.status(404).json(createActionResponse(404, "No test runners found."));
        }

        res.status(200).json(rows.map(r => ({
            name: r.name,
            status: r.status,
            platform: r.platform || [],
            lastHeartbeat: r.last_heartbeat ? new Date(r.last_heartbeat).getTime() : null
        })));
    } catch (error) {
        console.error("Error fetching test runners:", error);
        res.status(500).json(createActionResponse(500, "Failed to retrieve test runners."));
    }
});

// GET /test-runner/{id} - Get detailed runner info
router.get('/test-runner/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json(createActionResponse(404, "Test runner not found"));
        }
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// POST /test-runner/{id}/heartbeat - Send heartbeat to runner
router.post('/test-runner/:id/heartbeat', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json(createActionResponse(404, "Test runner not found"));
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
        res.status(200).json(createActionResponse(200, `Heartbeat acknowledged for runner ${id}.`));
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

export default router;