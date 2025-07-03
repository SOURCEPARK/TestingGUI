import express from 'express';
import * as runnerController from '../controllers/runnerController.js';

const router = express.Router();

//------For frontend------
//GET paginated list of test runners
router.get('/', runnerController.getAllRunners);
//GET detailed test runner information
router.get('/:id', runnerController.getRunnerById);
//GET heartbeat to frontend
//router.get('/:id/heartbeat', runnerController.getHeartbeat);//TODO: seems unused, remove if not needed
//GET available runners for test xyz mit platform x - which runners that are IDLE can run this platform and therefore the test
router.get('/:id/available', runnerController.getAvailableRunnerForAvailableTest);

//------For test runners------
//POST runner registrieren sich
router.post('/register', runnerController.registerRunner);
//POST hier werden die Heartbeats der Runner empfangen
router.post('/heartbeat/:id', runnerController.receiveHeartbeat);
//POST Heartbeat sendet Request für neuen heartbeat an den entsprechenden Runner
router.post('/:id/heartbeat', runnerController.sendHeartbeat);
//POST runner senden Report hierhin, wenn Testlauf completed ist
router.post('/:testRunId/complete', runnerController.receiveCompleted)

export default router;