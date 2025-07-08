import db from '../config/db.js';
import axios from 'axios';
import {v4 as uuidv4 } from 'uuid';
import { heartbeatUpdate } from './runnerController.js';

/** * Test Controller for managing tests in the Testing GUI application.
 * Handles operations such as retrieving, starting, stopping, and restarting tests,
 * as well as managing test runners and available tests.
 *
 * @module testController
 */

/** *GET paginated list of tests
 * @param {Object} req - Express request object containing pagination parameters.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a paginated list of tests or an error message.
 */
export const getTests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10000;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(
      `SELECT tests.id, tests.test_plan_id AS "testPlanId", tests.testrun_id AS "testRunId", tests.name, tests.status, tests.test_runner_id AS "testRunner", test_runners.last_heartbeat AS "lastHeartbeat", tests.progress
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

/** *GET detailed information about a specific test by its ID.
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends detailed test information or an error message.
 */
export const getTestById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json( "Missing test ID.");

  try {
    const result = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json("Test not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Database error");
  }
};

/** * POST start a test by test plan ID and test runner ID.
 * It checks if the test plan exists, if the test runner is available, and then starts the test.
 *
 * @param {Object} req - Express request object containing testPlanId and testRunnerId in body.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message with testRunId or an error message.
 */
export const startTest = async (req, res) => {
  const { testId, testRunnerId } = req.body;
  const testPlanId = testId;

  if (!testPlanId || !testRunnerId) {
    return res.status(400).json({
      testRunId: null,
      message: "Fehlende Parameter",
      errorcode: "400",
      errortext: "Missing testPlanId or testRunnerId."
    });
  }

  try {
    const testResult = await db.query('SELECT * FROM available_tests WHERE id = $1', [testPlanId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({
        testRunId: null,
        message: "Test nicht gefunden",
        errorcode: "404",
        errortext: "Test not found in available tests."
      });
    }

    const runnerCheck = await db.query(
      'SELECT id FROM test_runners WHERE id = $1 AND status = $2',
      [testRunnerId, 'IDLE']
    );
    if (runnerCheck.rows.length === 0) {
      return res.status(400).json({
        testRunId: null,
        message: "Testrunner nicht verfügbar",
        errorcode: "400",
        errortext: "Test runner is not available."
      });
    }

    const test = testResult.rows[0];
    const descriptorRaw = test.descriptor;
    const descriptor = JSON.parse(descriptorRaw);
    const testPlanUrl = descriptor?.testdescriptor?.testplan;
    const platforms = descriptor?.testdescriptor?.platforms || [];

    if (!testPlanUrl || platforms.length === 0) {
      return res.status(400).json({
        testRunId: null,
        message: "Ungültiger Descriptor",
        errorcode: "400",
        errortext: "Missing test plan or platforms in descriptor."
      });
    }

    const runnerResult = await db.query(
      'SELECT * FROM test_runners WHERE id = $1',
      [testRunnerId]
    );
    if (runnerResult.rows.length === 0) {
      return res.status(404).json({
        testRunId: null,
        message: "Testrunner nicht gefunden",
        errorcode: "404",
        errortext: "Test runner not found."
      });
    }

    const runner = runnerResult.rows[0];

    const response = await axios.post(`${runner.url}/start-test`, {
      testDescription: test.description,
      testPlan: testPlanUrl,
      platforms: platforms
    });

    const { testRunId: runnerTestRunId, message, errorcode, errortext } = response.data;

    // Prüfe required Felder gemäß TestStartResponse
    if (runnerTestRunId === undefined || message === undefined) {
      throw new Error("Runner start-test response missing required fields.");
    }

    if (errorcode || errortext) {
      console.warn(`Runner returned error: ${errorcode} - ${errortext}`);
    }

    const newTestId = uuidv4();
    await db.query(`
      INSERT INTO tests (
        id, name, platform, description,
        status, test_runner_id, start_time, elapsed_seconds,
        progress, testrun_id, url, test_plan_id,
        error_code, error_text
      )
      VALUES ($1, $2, $3, $4, 
              'RUNNING', $5, $6, 0,
              0, $7, $8, $9,
              $10, $11)
    `, [
      newTestId,
      test.name,
      test.platform,
      test.description,
      testRunnerId,
      new Date().toISOString(),
      runnerTestRunId,
      testPlanUrl,
      testPlanId,
      errorcode || null,
      errortext || null
    ]);


    await db.query(
      'UPDATE test_runners SET status = $1, active_test = $2 WHERE id = $3',
      ['RUNNING', newTestId, testRunnerId]
    );

    await heartbeatUpdate(runner);

    return res.status(200).json({
      testRunId: runnerTestRunId,
      message: `TestID: ${newTestId} erfolgreich gestartet mit testPlanID ${testPlanId} auf Runner ${testRunnerId}.`,
    });
  } catch (error) {
    console.error('Error during test start:', error.message);
    return res.status(500).json({
      testRunId: null,
      message: "Interner Fehler beim Starten des Tests",
      errorcode: "500",
      errortext: error.message
    });
  }
};

/**
 * DELETE a test
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error message.
 */
export const deleteTest = async (req, res) => {
  const { id } = req.params;
  let runnerId, runnerUrl;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    // Versuche, zugehörigen Runner zu finden (optional)
    const runnerResult = await db.query(
      `SELECT id, url FROM test_runners WHERE active_test = $1`, [id]
    );

    const testResult = await db.query(
      `SELECT testrun_id FROM tests WHERE id = $1`, [id]
    );
    const testRunId = testResult.rows[0]?.testrun_id;

    if (runnerResult.rows.length > 0) {
      console.log("Stopping test:", testRunId);
      runnerId = runnerResult.rows[0].id;
      runnerUrl = runnerResult.rows[0].url;

      try {
        await axios.get(`${runnerUrl}/stop-test/${testRunId}`);
      } catch (stopErr) {
        console.error("Fehler beim Stoppen des Tests:", stopErr.message);
        return res.status(500).json("Fehler beim Stoppen.");
      }
    }

    // Successfully stop the test, now delete it from the database
    const result = await db.query('DELETE FROM tests WHERE testrun_id = $1 RETURNING *', [testRunId]);
    if (result.rows.length === 0) {
      return res.status(404).json("Test not found");
    }

    await db.query(
      'UPDATE test_runners SET status = $1, active_test = NULL WHERE id = $2',
      ['IDLE', runnerId]
    );

    console.log(`Test ${testRunId} deleted successfully. Runner ${runnerId} is now available.`);

    res.status(200).json(`Test: ${id} mit testRunId: ${testRunId} gelöscht. Test runner ${runnerId} wieder verfügbar.`);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json("Database error");
  }
};

/** * POST restart a test by test ID
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message with new testRunId or an error message.
 */
export const restartTest = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      testRunId: null,
      message: "Fehlende testId",
      errorcode: "400",
      errortext: "Missing testId parameter"
    });
  }

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      await db.query(
        'UPDATE tests SET status = $1, error_text = $2, error_code = $3 WHERE id = $4',
        ['FAILED', 'Test not found', '404', id]
      );
      return res.status(404).json({
        testRunId: null,
        message: "Test nicht gefunden",
        errorcode: "404",
        errortext: "Test not found"
      });
    }

    const test = testResult.rows[0];
    const testRunnerId = test.test_runner_id;
    let testRunId = test.testrun_id;
    const testPlanId = test.test_plan_id;

    const runnerResult = await db.query(
      'SELECT * FROM test_runners WHERE id = $1',
      [testRunnerId]
    );

    if (runnerResult.rows.length === 0) {
      await db.query(
        'UPDATE tests SET status = $1, error_text = $2, error_code = $3 WHERE id = $4',
        ['FAILED', 'Test runner not found', '404', id]
      );
      return res.status(404).json({
        testRunId: null,
        message: "Testrunner nicht gefunden",
        errorcode: "404",
        errortext: "Test runner not found"
      });
    }

    const runner = runnerResult.rows[0];

    console.log(`Restarting test plan ${testPlanId} on runner ${testRunnerId} with URL ${runner.url}, testRunId: ${testRunId}`);

    const response = await axios.get(`${runner.url}/restart-test/${testRunId}`);

    const { testRunId: newTestRunId, message, errorcode, errortext } = response.data;

    // Prüfe required Felder aus TestRestartResponse
    if (newTestRunId === undefined || message === undefined) {
      throw new Error("Runner restart-test response missing required fields.");
    }

    console.log(`Test plan ${testPlanId} restarted on runner ${testRunnerId}, new testRunId: ${newTestRunId}`);

    if (response.status === 200) {
      await db.query(
        `UPDATE tests
         SET testrun_id = $1,
             progress = $2,
             status = $3,
             error_code = $4,
             error_text = $5
         WHERE id = $6`,
        [
          newTestRunId,
          0.0,
          'RUNNING',
          errorcode || null,
          errortext || null,
          id
        ]
      );

      await heartbeatUpdate(runner);

      return res.status(200).json({
        testRunId: newTestRunId,
        message: message,
        errorcode: errorcode || null,
        errortext: errortext || null
      });
    } else {
      await db.query(
        `UPDATE tests
         SET status = $1,
             error_text = $2,
             error_code = $3
         WHERE id = $4`,
        ['FAILED', response.statusText || 'Unknown error', `${response.status}`, id]
      );
      return res.status(500).json({
        testRunId: null,
        message: "Testneustart fehlgeschlagen",
        errorcode: `${response.status}`,
        errortext: response.statusText || "Unknown error"
      });
    }

  } catch (error) {
    console.error("Restart error:", error.message);
    await db.query(
      'UPDATE tests SET status = $1, error_text = $2, error_code = $3 WHERE id = $4',
      ['FAILED', error.message, '500', id]
    );
    return res.status(500).json({
      testRunId: null,
      message: "Fehler beim Neustart",
      errorcode: "500",
      errortext: error.message
    });
  }
};

/** * GET current test status
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends the current test status or an error message.
 */
export const getTestStatus = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    // 1) Hole Test-Infos inkl. Runner
    const testResult = await db.query(
      'SELECT testrun_id, test_runner_id FROM tests WHERE id = $1',
      [id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json("Test nicht gefunden");
    }

    const { testrun_id: testRunId, test_runner_id: runnerId } = testResult.rows[0];
    if (!testRunId || !runnerId) {
      return res.status(400).json("Fehlende runnerId oder testRunId.");
    }

    // 2) Hole Runner
    const runnerResult = await db.query(
      'SELECT * FROM test_runners WHERE id = $1',
      [runnerId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json("Testrunner nicht gefunden");
    }

    const runner = runnerResult.rows[0];

    // 3) Führe heartbeatUpdate aus
    await heartbeatUpdate(runner);

    // 4) Danach Teststatus abfragen
    const runnerUrl = runner.url;
    const response = await axios.get(`${runnerUrl}/test-status/${testRunId}`);
    const data = response.data;

    await db.query(`
      UPDATE tests SET 
        status = COALESCE($1, status),
        start_time = COALESCE($2::timestamptz, start_time),
        elapsed_seconds = COALESCE($3, elapsed_seconds),
        progress = COALESCE($4, progress),
        error_code = COALESCE($5, error_code),
        error_text = COALESCE($6, error_text),
        last_message = COALESCE($7, last_message)
      WHERE id = $8
    `, [
      data.status || null,
      data.startTime || null,
      data.elapsedSeconds || null,
      data.progress || null,
      data.errorcode || null,
      data.errortext || null,
      data.message || null,
      id
    ]);

    // 5) Hole aktualisierte Daten wie im alten Format
    const result = await db.query(
      'SELECT id, status, progress, last_message FROM tests WHERE id = $1',
      [id]
    );

    res.status(200).json(result.rows); // [] mit einem Objekt

  } catch (err) {
    if (err.response?.status === 404) {
      res.status(404).json("Testlauf nicht gefunden");
    } else {
      console.error("Fehler bei der Statusabfrage:", err.message);
      res.status(500).json("Fehler beim Abrufen des Teststatus");
    }
  }
}

/** * GET list of available tests
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a list of available tests or an error message.
 */
export const getAvailableTests = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM available_tests');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json("Database error");
  }
};

//TODO: seems unused, remove?
/** * GET list of available test runners of the test plan required platform.
 * @param {Object} req - Express request object containing the test plan ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a list of available test runners or an error message.
 */
// export const getAvailableRunners = async (req, res) => {
//   const { id } = req.params;
//   if (!id) return res.status(400).json("Missing test plan ID.");

//   const testPlanId = id;

//   try {
//     const testResult = await db.query('SELECT id, platform FROM tests WHERE test_plan_id = $1', [testPlanId]);
//     if (testResult.rows.length === 0) {
//       return res.status(404).json("Test Plan ID not found");
//     }
//     const testPlatforms = testResult.rows[0].platform ? testResult.rows[0].platform.split(',').map(p => p.trim()) : [];

//     const runnerResult = await db.query(`
//       SELECT id, name, platform FROM test_runners WHERE status NOT IN ('ERROR', 'RUNNING')`);
    
//     if (runnerResult.rows.length === 0) {
//       return res.status(404).json(`No available runners`);
//     }
    
//     const availableRunners = runnerResult.rows.filter(runner => {
//       const runnerPlatforms = runner.platforms ? runner.platforms.split(',').map(p => p.trim()) : [];
//       return testPlatforms.some(testPlatform => runnerPlatforms.includes(testPlatform));
//     });

//     if (availableRunners.length === 0) {
//       return res.status(404).json(`No available runners for test ${id}`);
//     }else {
//       res.status(200).json({
//         message: `Available runners for test ${id}:`,
//         runners: availableRunners
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Database error");
//   }
// };

/** * POST reload tests from GitHub
 * This function fetches test descriptors from a GitHub repository, updates or inserts them into the database,
 * and removes any tests that are no longer present in the repository.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message with updated, failed, and deleted tests or an error message.
 */
export const reloadTests = async (req, res) => {
    console.log("Reloading test descriptors from GitHub.");

    try {
        const baseUrl = 'https://api.github.com/repos/SOURCEPARK/TestPlans/contents/descriptor';
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
        };

        const resDir = await axios.get(baseUrl, { headers });
        const files = resDir.data;

        const successfulUpdates = [];
        const failedDescriptors = [];
        const foundIds = [];

        const jsonFiles = files.filter(file => file.name.endsWith('.json'));

        for (const jsonFile of jsonFiles) {
            try {
                const jsonRes = await axios.get(jsonFile.download_url, { headers });
                const descriptor = jsonRes.data;

                const id = descriptor.testdescriptor?.id;
                const name = descriptor.testdescriptor?.name;
                const lastReload = new Date().toISOString();
                const platforms = descriptor.testdescriptor?.platforms?.join(', ') || null;
                const readmeFile = files.find(file => file.name === jsonFile.name.replace('.json', '.md'));

                let description = '';
                if (readmeFile) {
                    const readmeRes = await axios.get(readmeFile.download_url, { headers });
                    description = readmeRes.data;
                }

                foundIds.push(id); // ID als gefunden markieren

                const existingTest = await db.query(
                    'SELECT id FROM available_tests WHERE id = $1',
                    [id]
                );

                if (existingTest.rows.length > 0) {
                    await db.query(
                        'UPDATE available_tests SET name = $1, last_reload = $2, platform = $3, description = $4, descriptor = $5 WHERE id = $6',
                        [name, lastReload, platforms, description, descriptor, id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO available_tests (id, name, last_reload, platform, description, descriptor) VALUES ($1, $2, $3, $4, $5, $6)',
                        [id, name, lastReload, platforms, description, descriptor]
                    );
                }

                successfulUpdates.push(name);
            } catch (err) {
                console.error(`Error processing ${jsonFile.name}:`, err.message);
                failedDescriptors.push(jsonFile.name);
            }
        }

        // Alle IDs aus der DB holen
        const dbTests = await db.query('SELECT id FROM available_tests');
        const dbIds = dbTests.rows.map(row => row.id);

        // IDs finden, die nicht mehr im GitHub vorhanden sind
        const toDelete = dbIds.filter(id => !foundIds.includes(id));

        // Löschen
        for (const id of toDelete) {
            await db.query('DELETE FROM available_tests WHERE id = $1', [id]);
        }

        res.status(200).json({
            success: true,
            message: 'Descriptor reload completed',
            updated: successfulUpdates,
            failed: failedDescriptors,
            deleted: toDelete,
            timestamp: new Date()
        });

    } catch (err) {
        console.error('Critical error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Failed to reload descriptors',
            details: err.message
        });
    }
};

/** * GET last reload timestamp
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends the last reload timestamp or a message if not yet loaded.
 */
export const getLastReload = async (req, res) => {
  const result = await db.query('SELECT DISTINCT last_reload FROM available_tests');
  if (result.rows.length === 0) {
    res.status(200).json({
      last_reload: null,
      message: "Not yet loaded."
    });
  } else {
    res.status(200).json(result.rows[0]);
  }
};

/**GET sends stop request to TestRunner that executes the specified test
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error message.
 */
export const stopTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing required test ID");

  try {
    const runnerResult = await db.query(
      `SELECT id, url FROM test_runners WHERE active_test = $1`, [id]
    );

    const testResult = await db.query(
      `SELECT testrun_id, status FROM tests WHERE id = $1`, [id]
    );
    const testRunId = testResult.rows[0]?.testrun_id;

    if (testResult.rows[0]?.status !== "RUNNING") {
      return res.status(400).json("Test is not running");
    }

    if (runnerResult.rows.length > 0) {
      console.log("Stopping test:", testRunId);
      const runnerUrl = runnerResult.rows[0].url;

      try {
        const response = await axios.get(`${runnerUrl}/stop-test/${testRunId}`);
        const { testRunId: responseTestRunId, message } = response.data;

        if (
          responseTestRunId === undefined ||
          message === undefined
        ) {
          throw new Error("Runner stop-test response missing required fields.");
        }

        if (response.data.errorcode || response.data.errortext) {
          console.error(`Runner reported error: ${response.data.errorcode} - ${response.data.errortext}`);
        }

      } catch (stopErr) {
        console.error("Fehler beim Stoppen des Tests:", stopErr.message);
        return res.status(500).json("Fehler beim Stoppen des Tests.");
      }

      await db.query('UPDATE tests SET status = $1 WHERE id = $2', ['PAUSED', id]);

      return res.status(200).json(`Test ${id} mit testRunId ${testRunId} gestoppt.`);
    } else {
      return res.status(404).json("No runner found for this test.");
    }

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json("Database error");
  }
};

/**GET sends resume to TestRunner that executes the specified test - if the test was stopped
 * @param {Object} req - Express request object containing the test ID in params.
 * @param {Object} res - Express response object to send the result.
 * @returns {Promise<void>} Sends a success message or an error message.
 */
export const resumeTest = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      testRunId: null,
      message: "Missing required test ID",
      errorcode: "400",
      errortext: "Missing test ID parameter"
    });
  }

  try {
    const testResult = await db.query(
      'SELECT status, testrun_id FROM tests WHERE id = $1',
      [id]
    );

    const testStatus = testResult.rows[0]?.status;
    const testRunId = testResult.rows[0]?.testrun_id;

    if (!testRunId) {
      return res.status(400).json({
        testRunId: null,
        message: "TestRunId not found for test",
        errorcode: "400",
        errortext: "No testRunId available"
      });
    }

    if (testStatus !== "PAUSED") {
      return res.status(400).json({
        testRunId: testRunId,
        message: "Test is not paused",
        errorcode: "400",
        errortext: "Test status is not PAUSED"
      });
    }

    const runnerResult = await db.query(
      `SELECT id, url FROM test_runners WHERE active_test = $1`, [id]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json({
        testRunId: testRunId,
        message: "Testrunner not found for this test",
        errorcode: "404",
        errortext: "No runner associated with this test"
      });
    }

    const runnerUrl = runnerResult.rows[0].url;

    console.log("Resuming test:", testRunId);

    let response;
    try {
      response = await axios.get(`${runnerUrl}/resume-test/${testRunId}`);
    } catch (resumeErr) {
      console.error("Fehler beim Fortsetzen des Tests:", resumeErr.message);
      await db.query(
        'UPDATE tests SET error_code = $1, error_text = $2 WHERE id = $3',
        ['500', resumeErr.message, id]
      );
      return res.status(500).json({
        testRunId: testRunId,
        message: "Fehler beim Fortsetzen des Tests",
        errorcode: "500",
        errortext: resumeErr.message
      });
    }

    const { testRunId: responseTestRunId, message, errorcode, errortext } = response.data;

    // Required-Felder prüfen
    if (responseTestRunId === undefined || message === undefined) {
      throw new Error("Runner resume-test response missing required fields.");
    }

    await db.query(
      `UPDATE tests
       SET status = $1,
           error_code = $2,
           error_text = $3
       WHERE id = $4`,
      ['RUNNING', errorcode || null, errortext || null, id]
    );

    // Optional: Runner-Status updaten
    await db.query(
      'UPDATE test_runners SET status = $1 WHERE id = $2',
      ['RUNNING', runnerResult.rows[0].id]
    );

    return res.status(200).json({
      testRunId: responseTestRunId,
      message: message,
      errorcode: errorcode || null,
      errortext: errortext || null
    });

  } catch (err) {
    console.error("Database error:", err.message);
    await db.query(
      'UPDATE tests SET error_code = $1, error_text = $2 WHERE id = $3',
      ['500', err.message, id]
    );
    res.status(500).json({
      testRunId: null,
      message: "Interner Fehler beim Fortsetzen",
      errorcode: "500",
      errortext: err.message
    });
  }
};