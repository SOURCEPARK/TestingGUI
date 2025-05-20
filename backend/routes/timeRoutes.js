import express from 'express';
import { getTime } from '../controllers/timeController.js';

const router = express.Router();

router.get('/', getTime);

export default router;
