import express from 'express';
import bodyParser from 'body-parser';
//import { simpleGit } from 'simple-git';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

const router = express.Router();

//app.use(bodyParser.json());

const TestRepo_URL = 'https://github.com/SOURCEPARK/TestPlans.git';

let lastReloadTimestamp = new Date().toISOString();
const createActionResponse = (code, message) => ({ code, message });

// --- API Routes ---
// GET /test - Get paginated list of tests
router.get('/test', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
			const result = await db.query(
				`SELECT id, name, status, test_runner AS "testRunner", last_heartbeat AS "lastHeartbeat", progress
				FROM tests
				ORDER BY id
				LIMIT $1 OFFSET $2`,
				[limit, offset]
			);

			res.status(200).json(result.rows);
    } catch (err) {
			console.error('Database query error:', err);
			res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /test/{id} - Get detailed test information
router.get('/test/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
			return res.status(400).json(createActionResponse(400, "Missing test ID in request parameters."));
    }

    try {
			const result = await db.query('SELECT * FROM test_details WHERE id = $1', [id]);
			if (result.rows.length > 0) {
				res.status(200).json(result.rows[0]);
			} else {
				res.status(404).json(createActionResponse(404, "Test not found"));
			}
    } catch (error) {
        console.error(error);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// POST /test/start - Start a test
router.post('/test/start', async (req, res) => {
    const { testId, testRunnerId } = req.body;

    if (!testId || !testRunnerId) {
        return res.status(400).json(createActionResponse(400, "Missing testId or testRunnerId in request body."));
    }

    try {
			const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [testId]);
			const runnerResult = await db.query('SELECT * FROM test_runners WHERE id = $1', [testRunnerId]);

			if (testResult.rows.length === 0) {
				return res.status(404).json(createActionResponse(404, `Test mit id ${testId} not found.`));
			}
			if (runnerResult.rows.length === 0) {
				return res.status(404).json(createActionResponse(404, `Test runner mit id ${testRunnerId} not found.`));
			}

			const runner = runnerResult.rows[0];
			if (runner.status === 'RUNNING') {
				return res.status(409).json(createActionResponse(409, `Test runner ${runner.name} is currently busy.`));
			}
			if (runner.status === 'ERROR') {
				return res.status(409).json(createActionResponse(409, `Test runner ${runner.name} is not available.`));
			}

			// Update test status and test runner status in the database
			await db.query('UPDATE tests SET status = $1, test_runner = $2 WHERE id = $3', ['RUNNING', testRunnerId, testId]);
			await db.query('UPDATE test_runners SET status = $1 WHERE id = $2', ['RUNNING', testRunnerId]);

			res.status(200).json(createActionResponse(200, `Test ${testId} started with runner ${testRunnerId}`));
    } catch (error) {
			console.error(error);
			res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// DELETE /test/{id} - Delete a test
router.delete('/test/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(createActionResponse(400, "Missing test ID in request parameters."));
    }

    try {
        const result = await db.query('DELETE FROM tests WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length > 0) {
            await db.query('DELETE FROM test_details WHERE id = $1', [id]);
            res.status(200).json(createActionResponse(200, `Test ${id} deleted successfully.`));
        } else {
            res.status(404).json(createActionResponse(404, "Test not found"));
        }
    } catch (err) {
        console.error(err);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// POST /test/{id}/restart - Restart a test
router.post('/test/:id/restart', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(createActionResponse(400, "Missing test ID in request parameters."));
    }

    try {
        const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
        if (testResult.rows.length === 0) {
            return res.status(404).json(createActionResponse(404, "Test not found"));
        }

        await db.query(`
            UPDATE tests
            SET status = 'Pending', progress = 0
            WHERE id = $1
        `, [id]);

        await db.query(`
            UPDATE test_details
            SET status = 'Pending', progress = 0, start_time = NULL, elapsed_seconds = 0
            WHERE id = $1
        `, [id]);

        console.log(`Test ${id} restart requested.`);
        res.status(200).json(createActionResponse(200, `Test ${id} is restarting.`));
    } catch (error) {
        console.error(error);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// GET /test/{id}/status - Get current test status
router.get('/test/:id/status', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(createActionResponse(400, "Missing test ID in request parameters."));
    }

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
});

// GET /available-tests - Get all available tests
router.get('/available-tests', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM available_tests');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json(createActionResponse(500, "Database error"));
    }
});

// GET /test/{id}/runners - Get available test runners for a test
router.get('/test/:id/runners', async (req, res) => {
    const { id } = req.params;
    if (!id) {
			return res.status(400).json(createActionResponse(400, "Missing test ID in request parameters."));
    }

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
});

// POST /test/reload - Trigger test reload from GitHub
router.post('/test/reload', (req, res) => {
    console.log("Test reload from GitHub.");
    //TODO: git pull or fetch from GitHub
    // tests = fetchTestsFromGitHub();
    res.status(200).json(createActionResponse(200, `Test plans successfully reloaded. Last reload: ${lastReloadTimestamp}`));
});

// GET /test/last-reload - Get last reload timestamp
router.get('/test/last-reload', (req, res) => {
    res.status(200).json({ lastReload: lastReloadTimestamp });
});

export default router;