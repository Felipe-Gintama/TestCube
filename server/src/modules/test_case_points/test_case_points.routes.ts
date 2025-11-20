import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { 
    AddTestCasePointController,
    GetTestCasePointsController,
    UpdateTestCasePointController,
    DeleteTestCasePointController,
    GetTestCasePointController
 } from './test_case_points.controller';

const router = Router()

router.post('/', authMiddleware, AddTestCasePointController);
router.get('/:testCaseId/points', authMiddleware, GetTestCasePointsController);
router.put('/:id', authMiddleware, UpdateTestCasePointController);
router.delete('/:id', authMiddleware, DeleteTestCasePointController);
router.get('/:id', authMiddleware, GetTestCasePointController);

export default router