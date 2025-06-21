import express from 'express';
import * as runnerController from '../controllers/runnerController.js';

const router = express.Router();

//------For frontend------
//GET paginated list of test runners
router.get('/', runnerController.getAllRunners);
//GET detailed test runner information
router.get('/:id', runnerController.getRunnerById);
//GET heartbeat to frontend
router.get('/:id/heartbeat', runnerController.getHeartbeat);
//GET available runners for test xyz mit platform x - which runners that are IDLE can run this platform and therefore the test
router.get('/:id/available', runnerController.getAvailableRunnerForAvailableTest);

//------For test runners------
//POST runner registrieren sich
router.post('/register', runnerController.registerRunner);
//POST hier werden die Heartbeats der Runner empfangen
router.post('/heartbeat', runnerController.receiveHeartbeat);
//POST Heartbeat sendet Request für neuen heartbeat an den entsprechenden Runner
router.post('/:id/heartbeat', runnerController.sendHeartbeat);

export default router;