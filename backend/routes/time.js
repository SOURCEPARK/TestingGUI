import { Router } from 'express';
const router = Router();
import { getTime } from '../controllers/timeController.js';

router.get('/', getTime);

export default router;
