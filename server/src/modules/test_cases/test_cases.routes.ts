import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { getTestCases, createTestCase, updateTestCase, getUserTestCases } from './test_cases.controller'

const router = Router()

router.get('/', authMiddleware, getTestCases);
router.get('/:id', authMiddleware, getUserTestCases);
router.post('/', authMiddleware, createTestCase);
router.put('/:id', authMiddleware, updateTestCase);

export default router
