import express from 'express';
import * as runnerController from '../controllers/runnerController.js';

const router = express.Router();

router.get('/', runnerController.getAllRunners);
router.get('/:id', runnerController.getRunnerById);
router.post('/:id/heartbeat', runnerController.sendHeartbeat);

export default router;