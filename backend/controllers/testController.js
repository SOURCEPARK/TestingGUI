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

//GET detailed test information
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

// POST start a test
export const startTest = async (req, res) => {
  const { testId, testRunnerId } = req.body;

  if (!testId || !testRunnerId) {
    return res.status(400).json("Missing testId or testRunnerId.");
  }

  try {
    // Testdefinition aus available_tests holen
    const testResult = await db.query('SELECT * FROM available_tests WHERE id = $1', [testId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json("Test not found in available tests.");
    }

    const test = testResult.rows[0];
    const testPlanUrl = `https://github.com/SOURCEPARK/TestPlans.git#${test.path}`;
    const testrunId = uuidv4();

    // Testlauf beim Runner auslösen
    const response = await axios.post('http://simpletestrunner:8082/test', {
      testPlan: testPlanUrl
    });

    // Neuen Eintrag in tests-Tabelle erzeugen
    await db.query(`
      INSERT INTO tests (
        id, name, path, platform, description,
        status, test_runner_id, start_time, elapsed_seconds,
        progress, testrun_id
      )
      VALUES ($1, $2, $3, $4, $5,
              'Running', $6, $7, 0,
              0, $8)
    `, [
      test.id,
      test.name,
      test.path,
      test.platform,
      test.description,
      testRunnerId,
      new Date().toISOString(),
      testrunId
    ]);

    return res.status(200).json({
      message: 'Test started with test plan URL.',
      testPlan: testPlanUrl,
      simpleTestRunnerResponse: response.data
    });
  } catch (error) {
    console.error('Error during test start:', error);
    return res.status(500).json({ error: 'Failed to start the server' });
  }
};

//DELETE a test
export const deleteTest = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    const result = await db.query('DELETE FROM tests WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(`Test ${id} deleted.`);
    } else {
      res.status(404).json("Test not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Database error");
  }
};

// GET restart a test
export const restartTest = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      testRunId: null,
      message: "Fehlende Test-ID",
      errorcode: "400",
      errortext: "Missing testId parameter"
    });
  }

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({
        testRunId: null,
        message: "Test nicht gefunden",
        errorcode: "404",
        errortext: "Test not found"
      });
    }

    const test = testResult.rows[0];
    const testRunnerId = test.test_runner_id;
    const testrunId = uuidv4(); // neue Testlauf-ID
    const now = new Date().toISOString();

    // Test vorinitialisieren (Pending)
    await db.query(`
      UPDATE tests 
      SET status = 'Pending', progress = 0, start_time = $1, elapsed_seconds = 0, testrun_id = $2
      WHERE id = $3
    `, [now, testrunId, id]);

    // Anfrage an den Testrunner
    const response = await axios.post('http://simpletestrunner:8082/test', {
      testId: id,
      testRunnerId
    });

    if (response.status === 200) {
      // Teststatus jetzt auf Running setzen
      await db.query(`
        UPDATE tests 
        SET status = 'Running', start_time = $1
        WHERE id = $2
      `, [now, id]);

      return res.status(200).json({
        testRunId: testrunId,
        message: "Test erfolgreich neu gestartet"
      });
    } else {
      return res.status(500).json({
        testRunId: testrunId,
        message: "Teststart fehlgeschlagen",
        errorcode: `${response.status}`,
        errortext: response.statusText || "Unknown error"
      });
    }

  } catch (error) {
    console.error("Restart error:", error.message);
    return res.status(500).json({
      testRunId: null,
      message: "Fehler beim Neustart",
      errorcode: "500",
      errortext: error.message
    });
  }
};


//GET test status
export const getTestStatus = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    const result = await db.query('SELECT id, status, progress, last_message FROM tests WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json("Test not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Database error");
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
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    const testResult = await db.query('SELECT id FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json("Test ID not found");
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
                        'UPDATE available_tests SET name = $1, platform = $2, description = $3, descriptor = $4 WHERE id = $5',
                        [name, platforms, description, descriptor, id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO available_tests (id, name, platform, description, descriptor) VALUES ($1, $2, $3, $4, $5)',
                        [id, name, platforms, description, descriptor]
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
  const result = await db.query('SELECT DISTINCT last_reload FROM tests');
  res.status(200).json(result.rows);
};