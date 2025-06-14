import express from 'express';
import * as runnerController from '../controllers/runnerController.js';

const router = express.Router();

//GET paginated list of test runners
router.get('/', runnerController.getAllRunners);
//GET detailed test runner information
router.get('/:id', runnerController.getRunnerById);
//POST heartbeat to runner
router.post('/:id/heartbeat', runnerController.getHeartbeat);
//POST runner registrieren sich
router.post('/register', runnerController.registerRunner);
//POST receive heartbeat from runner
router.post('/heartbeat', runnerController.receiveHeartbeat);
//GET available runners for test xyz mit platform x - which runners that are IDLE can run this platform and therefore the test
router.get('/:id/available', runnerController.getAvailableRunnerForAvailableTest);

export default router;