import express from 'express';
import * as testController from '../controllers/testController.js';

const router = express.Router();

//GET list of available tests
router.get('/available-tests', testController.getAvailableTests);
//GET last reload timestamp
router.get('/last-reload', testController.getLastReload);
//POST reload tests from GitHub
router.post('/reload', testController.reloadTests);
//POST start a test
router.post('/start', testController.startTest);
//GET current test status
router.get('/:id/status', testController.getTestStatus);
//POST restart a test
router.post('/:id/restart', testController.restartTest);
//GET list of available test runners
router.get('/:id/runners', testController.getAvailableRunners);
//DELETE a test
router.delete('/:id', testController.deleteTest);
//GET detailed test information
router.get('/:id', testController.getTestById);
//GET paginated list of test runners
router.get('/', testController.getTests);

export default router;