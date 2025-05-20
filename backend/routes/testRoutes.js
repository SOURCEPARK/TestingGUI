import express from 'express';
import * as testController from '../controllers/testController.js';

const router = express.Router();

router.get('/available-tests', testController.getAvailableTests);
router.get('/last-reload', testController.getLastReload);
router.post('/reload', testController.reloadTests);
router.post('/start', testController.startTest);
router.get('/:id/status', testController.getTestStatus);
router.post('/:id/restart', testController.restartTest);
router.get('/:id/runners', testController.getAvailableRunners);
router.delete('/:id', testController.deleteTest);
router.get('/:id', testController.getTestById);
router.get('/', testController.getTests);

export default router;