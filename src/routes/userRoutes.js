import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getUsers);

export default router;
