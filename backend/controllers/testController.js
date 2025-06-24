import db from '../config/db.js';
import axios from 'axios';
import {v4 as uuidv4 } from 'uuid';

//GET paginated list of tests
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

//GET detailed test information
export const getTestById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json( "Missing test ID.");

  //const testPlanId = id; 

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

// POST start a test
export const startTest = async (req, res) => {
  //testId is actually the test_plan_id, not the test id
  const { testId, testRunnerId } = req.body;
  const testPlanId = testId

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

    //Check if testRunnerId is valid and available
    //TODO: If the test runner is not available, return an error or change the test status to "PENDING"?
    const runnerCheck = await db.query('SELECT id FROM test_runners WHERE id = $1 AND status = $2', [testRunnerId, 'IDLE']);
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
  

    if (!testPlanUrl || platforms.length === 0 || !testPlanId) {
      return res.status(400).json({
        testRunId: null,
        message: "Ungültiger Descriptor",
        errorcode: "400",
        errortext: "Missing test plan, platforms or id in descriptor."
      });
    }

    const runnerResult = await db.query(
      'SELECT url FROM test_runners WHERE id = $1',
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

    const runnerUrl = runnerResult.rows[0].url;
    console.log("Runner URL:", runnerUrl);

    const response = await axios.post(`${runnerUrl}/start-test`, {
      testDescription: testResult.rows[0].description,
      testPlan: testPlanUrl,
      platforms: platforms
    });

    const testRunId = response.data.testRunId;

    console.log(`Test plan ${testPlanId} started on runner ${testRunnerId}, testRunId: ${testRunId}`);

    await db.query(`
      INSERT INTO tests (
        id, name, platform, description,
        status, test_runner_id, start_time, elapsed_seconds,
        progress, testrun_id, url, test_plan_id
      )
      VALUES ($1, $2, $3, $4, 
              'RUNNING', $5, $6, 0,
              0, $7, $8, $9)
    `, [
      uuidv4(),
      test.name,
      test.platform,
      test.description,
      testRunnerId,
      new Date().toISOString(),
      testRunId,
      testPlanUrl,
      testPlanId
    ]);

    // Get the unique test ID after inserting the test
    const testIdRaw = await db.query(
      'SELECT id FROM tests WHERE test_plan_id = $1',
      [test.id]
    );
    const testId = testIdRaw.rows[0].id;

    //active_test has the random test id, not the test plan id
    await db.query(
      'UPDATE test_runners SET status = $1, active_test = $2 WHERE id = $3',
      ['RUNNING', testId, testRunnerId]
    );

    return res.status(200).json({
      testRunId: testRunId,
      message: `TestID: ${testId} erfolgreich gestartet mit testPlanID ${testPlanId} auf Runner ${testRunnerId}.`,
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

//DELETE a test
export const deleteTest = async (req, res) => {
  //The id here is testId after checking in the GUI
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

    res.status(200).json(`Test ${testRunId} gelöscht. Test runner ${runnerId} wieder verfügbar.`);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json("Database error");
  }
};

// POST restart a test by test id
export const restartTest = async (req, res) => {
  //The id here is the test_id after checking in the GUI
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      testPlanId: null,
      message: "Fehlende testId",
      errorcode: "400",
      errortext: "Missing testId parameter"
    });
  }

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({
        testRunId: null,
        testId: id,
        message: "Test nicht gefunden",
        errorcode: "404",
        errortext: "Test not found"
      });
    }

    const test = testResult.rows[0];
    const testRunnerId = test.test_runner_id;
    const testRunId = test.testrun_id;
    const testPlanId = test.test_plan_id;

    const runnerResult = await db.query(
      'SELECT url FROM test_runners WHERE id = $1',
      [testRunnerId]
    );

    //TODO: maybe change to check the runner status instead of checking if it exists
    if (runnerResult.rows.length === 0) {
      return res.status(404).json({
        testRunnerId: testRunnerId,
        testId: id,
        testPlanId: testPlanId,
        message: "Testrunner nicht gefunden",
        errorcode: "404",
        errortext: "Test runner not found"
      });
    }

    const runnerUrl = runnerResult.rows[0].url;

    console.log(`Restarting test ${testPlanId} on runner ${testRunnerId} with URL ${runnerUrl}, testRunId: ${testRunId}`);

    // Anfrage an den Testrunner nach API-Spec
    const response = await axios.get(`${runnerUrl}/restart-test/${testRunId}`);

    if (response.status === 200) {
      const now = new Date().toISOString();

      // Teststatus aktualisieren
      await db.query(`
        UPDATE tests 
        SET status = 'RUNNING', progress = 0, start_time = $1, elapsed_seconds = 0
        WHERE test_plan_id = $2
      `, [now, testPlanId]);

      return res.status(200).json({
        testId: id,
        testPlanId: testPlanId,
        testRunId: testRunId,
        message: response.data.message || "Test erfolgreich neu gestartet"
      });
    } else {
      return res.status(500).json({
        testId: id,
        testPlanId: testPlanId,
        testRunId: testRunId,
        message: "Teststart fehlgeschlagen",
        errorcode: `${response.status}`,
        errortext: response.statusText || "Unknown error"
      });
    }

  } catch (error) {
    console.error("Restart error:", error.message);
    return res.status(500).json({
      testId: id,
      testPlanId: testPlanId,
      testRunId: testRunId,
      message: "Fehler beim Neustart",
      errorcode: "500",
      errortext: error.message
    });
  }
};

//GET current test status
export const getTestStatus = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
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

    const runnerResult = await db.query(
      'SELECT url FROM test_runners WHERE id = $1',
      [runnerId]
    );

    if (runnerResult.rows.length === 0) {
      return res.status(404).json("Testrunner nicht gefunden");
    }

    const runnerUrl = runnerResult.rows[0].url;
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

    // Hole aktualisierte Daten im alten Format
    const result = await db.query(
      'SELECT id, status, progress, last_message FROM tests WHERE id = $1',
      [id]
    );

    res.status(200).json(result.rows); // wie im alten Handler: [] mit einem Objekt

  } catch (err) {
    if (err.response?.status === 404) {
      res.status(404).json("Testlauf nicht gefunden");
    } else {
      console.error("Fehler bei der Statusabfrage:", err.message);
      res.status(500).json("Fehler beim Abrufen des Teststatus");
    }
  }
};

//GET list of available tests
export const getAvailableTests = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM available_tests');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json("Database error");
  }
};

//GET list of available test runners - soll prüfen welche Runner an verfügbar sind für die Plattform
export const getAvailableRunners = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test plan ID.");

  const testPlanId = id;

  try {
    const testResult = await db.query('SELECT id FROM tests WHERE test_plan_id = $1', [testPlanId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json("Test Plan ID not found");
    }

    const runnerResult = await db.query(`
      SELECT id, name FROM test_runners WHERE status NOT IN ('ERROR', 'RUNNING')
    `);

    if (runnerResult.rows.length === 0) {
      return res.status(404).json(`No available runners for test ${id}`);
    }else {
      res.status(200).json({
        message: `Available runners for test ${id}:`,
        runners: runnerResult.rows
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Database error");
  }
};

//POST reload tests from GitHub
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

//GET last reload timestamp
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

//GET sends stop to TestRunner that executes the specified test
export const stopTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing required test ID");


};

//GET sends resume to TestRunner that executes the specified test - if the test was stopped
export const resumeTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing required test ID");

  try{
    const status = await db.query(
    'SELECT status FROM tests WHERE id = $1'
    );


  } catch (err) {

  }

};