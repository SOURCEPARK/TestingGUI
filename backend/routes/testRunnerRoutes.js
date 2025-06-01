import express from 'express';
import * as runnerController from '../controllers/runnerController.js';

const router = express.Router();

//GET paginated list of test runners
router.get('/', runnerController.getAllRunners);
//GET detailed test runner information
router.get('/:id', runnerController.getRunnerById);
//POST heartbeat to runner
router.post('/:id/heartbeat', runnerController.sendHeartbeat);

export default router;