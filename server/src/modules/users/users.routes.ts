import { Router } from 'express';
import { GetAllUsers, register } from './users.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, GetAllUsers)
router.post('/register', register);

export default router