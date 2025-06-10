import db from '../config/db.js';
import axios from 'axios';
import {v4 as uuidv4 } from 'uuid';

let lastReloadTimestamp = new Date().toISOString();

//GET paginated list of tests
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
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [testId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json("Test not found in available tests.");
    }

    const test = testResult.rows[0];
    const testPlanUrl = `https://github.com/SOURCEPARK/TestPlans.git#${test.path}`;

    const response = await axios.post('http://simpletestrunner:8082/test', {
      testPlan: testPlanUrl
    });

    await db.query(`
      UPDATE tests 
      SET status = 'Running', test_runner_id = $1, start_time = $2, elapsed_seconds = 0
      WHERE id = $3
    `, [testRunnerId, new Date().toISOString(), testId]);

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

//POST restart a test
export const restartTest = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json("Missing testId.");
  }

  try {
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      return res.status(404).json("Test not found");
    }

    // Change test status to 'Pending' and reset progress
    await db.query(`
      UPDATE tests SET status = 'Pending', progress = 0, start_time = $1, elapsed_seconds = 0
      WHERE id = $2
    `, [new Date().toISOString(), id]);

    const testRunnerId = testResult.test_runner_id;
    console.log(`Restarting test ${id} with runner ${testRunnerId}`);

    const response = await axios.post('http://simpletestrunner:8082/test', {
      testId: id,
      testRunnerId: testRunnerId,
    });

    // Change test status to 'Running'
    await db.query(`
      UPDATE tests 
      SET status = 'Running', test_runner_id = $1, start_time = $2, elapsed_seconds = 0
      WHERE id = $3 RETURNING *
    `, [testRunnerId, new Date().toISOString(), id]);

    return res.status(200).json({ 
      message: 'SimpleTestRunner Server started',
      simpleTestRunnerResponse: response.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Database error");
  }
};

//GET test status
export const getTestStatus = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json("Missing test ID.");

  try {
    const result = await db.query('SELECT id, status, progress, message FROM tests WHERE id = $1', [id]);
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

//GET list of available test runners
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
    console.log("Test reload from GitHub.");

    try {
        const baseUrl = 'https://api.github.com/repos/SOURCEPARK/TestPlans/contents';
        const headers = {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        };

        const targetFolders = ['k8s', 'vagrant', 'docker'];
        const successfulUpdates = [];
        const failedFolders = [];

        for (const folderName of targetFolders) {
            try {
                // Prüfe ob Ordner existiert
                const folderRes = await axios.get(`${baseUrl}/${folderName}`, { headers });
                
                // Unterordner verarbeiten
                const subfolders = folderRes.data.filter(item => item.type === 'dir');
                
                if (subfolders.length === 0) {
                    console.log(`No subfolders found in ${folderName}`);
                    continue;
                }

                for (const subfolder of subfolders) {
                    try {
                        const subfolderContent = await axios.get(subfolder.url, { headers });
                        const readmeFile = subfolderContent.data.find(file => 
                            file.name.toLowerCase().startsWith('readme') && 
                            file.type === 'file'
                        );

                        let readmeContent = '';
                        if (readmeFile) {
                            const readmeRes = await axios.get(readmeFile.download_url, { headers });
                            readmeContent = readmeRes.data;
                        }

                        const folderPath = `${folderName}/${subfolder.name}`;
                        
                        try {
                            const testName = subfolder.name;

                            const existingTest = await db.query(
                                'SELECT id FROM available_tests WHERE path = $1', 
                                [folderPath]
                            );

                            if (existingTest.rows.length > 0) {
                                await db.query(
                                  'UPDATE available_tests SET description = $1, name = $2 WHERE path = $3', 
                                  [readmeContent, testName, folderPath]
                                );
                            } else {
                                await db.query(
                                    'INSERT INTO available_tests (id, path, name, description) VALUES ($1, $2, $3, $4)', 
                                    [uuidv4(), folderPath, testName, readmeContent]
                                );
                            }
                            successfulUpdates.push(folderPath);
                        } catch (dbError) {
                            console.error(`Database error for ${folderPath}:`, dbError.message);
                            failedFolders.push(folderPath);
                        }
                    } catch (subfolderError) {
                        console.error(`Error processing subfolder in ${folderName}:`, subfolderError.message);
                        failedFolders.push(`${folderName}/*`);
                    }
                }
            } catch (folderError) {
                if (folderError.response?.status === 404) {
                    console.log(`Folder ${folderName} does not exist in repository`);
                } else {
                    console.error(`Error accessing ${folderName}:`, folderError.message);
                }
                failedFolders.push(folderName);
            }
        }

        res.status(200).json({ 
            success: true,
            message: 'Test plans reload completed',
            updated: successfulUpdates,
            failed: failedFolders,
            timestamp: new Date()
        });

    } catch (err) {
        console.error('Critical error:', err.message);
        res.status(500).json({ 
            success: false,
            error: 'Failed to reload tests',
            details: err.message 
        });
    }
};

//GET last reload timestamp
export const getLastReload = async (req, res) => {
  const result = await db.query('SELECT DISTINCT last_reload FROM tests');
  res.status(200).json(result.rows);
};