import db from '../config/db.js';
import axios from 'axios';

/**
  * Controller for managing test runners.
  * Provides endpoints for retrieving, registering, and updating test runners,
  * as well as handling heartbeats and completed test reports.
  *
  * @module runnerController
  */

/** * GET paginated list of test runners
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a paginated list of test runners or an error message.
 */
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
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching test runners:", error);
    res.status(500).json("Failed to retrieve test runners.");
  }
};

/** * GET detailed information about a specific test runner by its ID.
 * @param {Object} req - Express request object containing the runner ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends the test runner details or an error message.
 */
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

/** * GET available runners for a specific test based on its required platform.
 * @param {Object} req - Express request object containing the test Plan ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends the list of available runners or an error message.
 */
export const getAvailableRunnerForAvailableTest = async (req, res) => {
  // the required id is actually the test_plan_id
  const { id:testPlanId } = req.params;

  if (!testPlanId) {
    return res.status(400).json("Missing testPlanId.");
  }

  try {
    // Platform des Tests holen
    const testResult = await db.query(
      `SELECT platform FROM available_tests WHERE id = $1`,
      [testPlanId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json("Testplan not found.");
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

    res.status(200).json(runnerResult.rows);
  } catch (error) {
    console.error("Error fetching runners for test:", error);
    res.status(500).json("Failed to fetch available runners.");
  }
};

//TODO: seems unused, remove if not needed
//GET Heartbeat aus DB ans Frontend senden
// export const getHeartbeat = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const result = await db.query(
//       `SELECT id AS runnerId,
//               status,
//               last_heartbeat AS timestamp,
//               elapsed_seconds AS uptimeSeconds,
//               last_feedback,
//               last_update,
//               platform,
//               url
//        FROM test_runners
//        WHERE id = $1`,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json("Test runner not found");
//     }

//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error fetching heartbeat:", error);
//     res.status(500).json("Failed to fetch heartbeat data.");
//   }
// };

/** * POST Sends a heartbeat request to a specific test runner to check if it is reachable and updates its status in the database.
 * @param {Object} req - Express request object containing the runner ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends the updated status of the runner or an error message.
 */
export const sendHeartbeat = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM test_runners WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json("Test runner not found");
    }

    const runner = result.rows[0];

    await heartbeatUpdate(runner);

    return res.status(200).json(`Runner: ${id} is ${runner.status}.`);
    //const now = new Date();

    // try {
    //   // Anfrage an Testrunner senden
    //   const response = await axios.get(`${runner.url}/heartbeat`);

    //   if (response.status === 200) {
    //     const status = response.data.status || 'ERROR';

    //     // if runner status is ERROR, update the test status to FAILED if active_test is not null
    //     if (status === 'ERROR') {
    //       await db.query(
    //         `UPDATE test_runners
    //          SET status = $1,
    //              last_feedback = $2,
    //              last_update = $3
    //          WHERE id = $4`,
    //         [status, response.data.message || 'Runner reported an error.', now.toISOString(), id]
    //       );

    //       console.log(`Runner ${id} reported an error: ${response.data.message}.`);

    //       if (runner.active_test) {
    //         await db.query(
    //           `UPDATE tests
    //           SET status = 'FAILED',
    //               last_message = $1,
    //               error_code = $2,
    //               error_text = $3
    //           WHERE id = $4`,
    //           [response.data.message || 'Runner reported an error.',
    //             response.data.errorcode || '500',
    //             response.data.errortext || 'Runner reported an error.',
    //           runner.active_test]
    //         );
    //         console.log(`Test ${runner.active_test} status set to FAILED due to runner error.`);
    //       }

    //       return res.status(200).json(`Runner ${id} reported an error: ${response.data.message}.`);
    //     }else if(status === 'IDLE' && runner.active_test) {
    //       // if runner is IDLE and has an active test, set the active_test to NULL
    //       await db.query(
    //         `UPDATE test_runners
    //          SET active_test = NULL,
    //              status = $1,
    //              last_feedback = $2,
    //              last_update = $3,
    //               last_heartbeat = $4
    //          WHERE id = $5`,
    //         [status, response.data.message || 'Runner is now idle.', now.toISOString(), Date.now(), id]
    //       );

    //       console.log(`Runner ${id} is now idle. Active test cleared.`);
    //       return res.status(200).json(`Runner ${id} is now idle. Active test cleared.`);
    //     }

    //     await db.query(
    //       `UPDATE test_runners
    //        SET last_heartbeat = $1,
    //            status = $2,
    //            last_feedback = $3,
    //            last_update = $4
    //        WHERE id = $5`,
    //       [
    //         Date.now(),
    //         status,
    //         response.data.message || 'Runner responded to health check.',
    //         now.toISOString(),
    //         id
    //       ]
    //     );

    //     console.log(`Runner ${id} is ${status}.`);
    //     return res.status(200).json(`Runner ${id} is ${status}.`);
    //   }
    // } catch (err) {
    //   // Runner nicht erreichbar
    //   await db.query(
    //     `UPDATE test_runners
    //      SET status = $1,
    //          last_feedback = $2,
    //          last_update = $3
    //      WHERE id = $4`,
    //     [
    //       'ERROR',
    //       'Runner did not respond to health check.',
    //       now.toISOString(),
    //       id
    //     ]
    //   );
    //   if (runner.active_test) {
    //     await db.query(
    //       `UPDATE tests
    //        SET status = 'FAILED',
    //            last_message = $1,
    //            error_code = $2,
    //            error_text = $3
    //        WHERE id = $4`,
    //       ['Runner did not respond to health check.',
    //         '503',
    //         'Runner did not respond to health check.',
    //         runner.active_test]
    //     );
    //     console.log(`Test ${runner.active_test} status set to FAILED due to runner not responding.`);
    //   }

    //   console.error(`Runner ${id} is not responding:`, err.message, `Runner status set to ERROR.`);
    //   return res.status(503).json(`Runner ${id} is not responding. Runner status set to ERROR.`);
    // }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};

/** * POST Receives a regular heartbeat from test runner and updates its status in the database.
 * @param {Object} req - Express request object containing the runner ID in params and heartbeat data in body.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error response.
 */
export const receiveHeartbeat = async (req, res) => {
  const { id: runnerId } = req.params;
  const {
    timestamp,
    status,
    sequence,
    uptimeSeconds,
    testRunId,
    testStatus,
    progress,
    message,
    errorcode,
    errortext
  } = req.body;

  //"required": ["timestamp", "status", "sequence", "uptimeSeconds"]

  if (!timestamp || !runnerId || !status || !uptimeSeconds || sequence === undefined) {
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
    const lastHeartbeat = runner.last_heartbeat ? new Date(runner.last_heartbeat).getTime() : 0;

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

    if (status === 'IDLE') {
      await db.query(`UPDATE test_runners SET active_test = NULL WHERE id = $1`, [runnerId]);
    }

    if (testRunId) {
      await db.query(`
        UPDATE tests
        SET 
          status = COALESCE($1, status),
          progress = COALESCE($2, progress),
          last_message = COALESCE($3, last_message),
          error_code = COALESCE($4, error_code),
          error_text = COALESCE($5, error_text),
          elapsed_seconds = COALESCE($6, elapsed_seconds)
        WHERE testrun_id = $7
      `, [
        testStatus || null,
        progress || null,
        message || null,
        errorcode || null,
        errortext || null,
        safeUptime,
        testRunId
      ]);
    }

    console.log(`Heartbeat #${sequence} from runner ${runnerId} received.`);
    res.status(200).json(`Heartbeat received for runner ${runnerId}.`);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json("Database error");
  }
};

/** * POST Register a new test runner or updates an existing one.
 * If the runner is already registered, it updates its details.
 * If the runner has an active test, it sets the test status to FAILED.
 *
 * @param {Object} req - Express request object containing runner details in body.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error response.
 */
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

    await db.query(
      `UPDATE tests
       SET status = 'FAILED',
           last_message = 'Runner restarted. Test status set to Failed.',
           error_code = '500',
           error_text = 'Runner was restarted during test execution.'
       WHERE test_runner_id = $1 AND status = 'RUNNING'`,
      [runnerId]
    );

    console.log(`Runner ${runnerId} registered successfully.`);
    res.status(201).json(`Runner ${runnerId} registered or updated successfully.`);
  } catch (error) {
    console.error("Error registering runner:", error);
    res.status(500).json("Failed to register runner.");
  }
};

/** * POST Receives a completed test report from a test runner and updates the test status in the database.
 * @param {Object} req - Express request object containing the report in body and testRunId in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error response.
 */
export const receiveCompleted = async (req, res) => {
  const { report } = req.body;
  const { testRunId } = req.params;

  if (!report || !testRunId) {
    return res.status(400).json("Fehlender Report oder testRunId");
  }

  try {
    const result = await db.query(
      `
      UPDATE tests 
      SET report = $1, status = 'PASSED', progress = 1 
      WHERE testrun_id = $2 
      RETURNING id
      `,
      [report, testRunId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("Testlauf nicht gefunden");
    }

    res.status(200).json({
      message: `Report erfolgreich gespeichert für testRunId ${testRunId}`,
      testId: result.rows[0].id
    });
  } catch (err) {
    console.error("Fehler beim Speichern des Reports:", err.message);
    res.status(500).json("Interner Serverfehler beim Speichern des Reports");
  }
};

/** * Updates the status of a test runner based on its heartbeat response.
 * If the runner reports an error, it updates the test status to FAILED if an active test exists.
 * If the runner is IDLE, it clears the active test.
 *
 * @param {Object} runner - The test runner object containing its details.
 * @returns {Promise<void>} Updates the runner and test statuses in the database.
 */
export const heartbeatUpdate = async (runner) => {
  const now = new Date();
  try {
    // Anfrage an Testrunner senden
    const response = await axios.get(`${runner.url}/heartbeat`);

    if (response.status === 200) {
      const { timestamp, status, sequence, uptimeSeconds } = response.data;

      // Required-Felder prüfen
      if (
        timestamp === undefined ||
        status === undefined ||
        sequence === undefined ||
        uptimeSeconds === undefined
      ) {
        throw new Error('Heartbeat response missing required fields.');
      }

      const runnerStatus = status || 'ERROR';

      if (runnerStatus === 'ERROR') {
        await db.query(
          `UPDATE test_runners
           SET status = $1,
               last_feedback = $2,
               last_update = $3
           WHERE id = $4`,
          [
            runnerStatus,
            response.data.message || 'Runner reported an error.',
            now.toISOString(),
            runner.id
          ]
        );

        console.log(`Runner ${runner.id} reported an error: ${response.data.message}.`);

        if (runner.active_test) {
          await db.query(
            `UPDATE tests
             SET status = 'FAILED',
                 last_message = $1,
                 error_code = $2,
                 error_text = $3,
                 progress = $4
             WHERE id = $5`,
            [
              response.data.message || 'Runner reported an error.',
              response.data.errorcode || '500',
              response.data.errortext || 'Runner reported an error.',
              0.0,
              runner.active_test
            ]
          );
          console.log(`Test ${runner.active_test} status set to FAILED due to runner error.`);
        }
      } else if (runnerStatus === 'IDLE' && runner.active_test) {
        await db.query(
          `UPDATE test_runners
           SET active_test = NULL,
               status = $1,
               last_feedback = $2,
               last_update = $3,
               last_heartbeat = $4
           WHERE id = $5`,
          [
            runnerStatus,
            response.data.message || 'Runner is now idle.',
            now.toISOString(),
            Date.now(),
            runner.id
          ]
        );

        console.log(`Runner ${runner.id} is now idle. Active test cleared.`);
      }

      await db.query(
        `UPDATE test_runners
         SET last_heartbeat = $1,
             status = $2,
             last_feedback = $3,
             last_update = $4
         WHERE id = $5`,
        [
          Date.now(),
          runnerStatus,
          response.data.message || 'Runner responded to health check.',
          now.toISOString(),
          runner.id
        ]
      );

      console.log(`Runner ${runner.id}'s status is: ${runnerStatus}.`);
    }
  } catch (err) {
    // Runner nicht erreichbar oder Fehler bei required Feldern
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
        runner.id
      ]
    );

    if (runner.active_test) {
      await db.query(
        `UPDATE tests
         SET status = 'FAILED',
             last_message = $1,
             error_code = $2,
             error_text = $3
         WHERE id = $4`,
        [
          'Runner did not respond to health check.',
          '503',
          'Runner did not respond to health check.',
          runner.active_test
        ]
      );
      console.log(`Test ${runner.active_test} status set to FAILED due to runner not responding.`);
    }

    console.error(`Runner ${runner.id} is not responding:`, err.message, `Runner status set to ERROR.`);
  }
};