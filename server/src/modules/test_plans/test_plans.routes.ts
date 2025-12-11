import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { CreateTestPlanController, GetTestPlansByProjectController, GetTestPlansController, cloneTestPlanController, deleteTestPlanController } from './test_plans.controller'

const router = Router()

router.get('/:releaseId/plans', authMiddleware, GetTestPlansController);
router.post('/new/:releaseId', authMiddleware, CreateTestPlanController);
router.post("/:planId/clone", authMiddleware, cloneTestPlanController);
router.get('/:projectId', authMiddleware, GetTestPlansByProjectController);
router.delete('/:planId', authMiddleware, deleteTestPlanController);

export default router;