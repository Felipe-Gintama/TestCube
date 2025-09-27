import { Router } from 'express';
import { register } from './users.controller';

const router = Router();
router.post('/register', register);

export default router