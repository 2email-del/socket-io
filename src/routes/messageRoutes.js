import { Router } from 'express';
import { getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', protect, getMessages);

export default router;
