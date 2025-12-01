import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { getTestCases, createTestCase, updateTestCase, getUserTestCases, getTestCaseById, DeleteTestCaseController } from './test_cases.controller'
import { deleteTestCase } from './test_cases.service';

const router = Router()

router.get('/', authMiddleware, getTestCases);
router.get('/:id', authMiddleware, getTestCaseById);
router.post('/', authMiddleware, createTestCase);
router.put('/:id', authMiddleware, updateTestCase);
router.delete('/:id/delete', authMiddleware, DeleteTestCaseController);

export default router
