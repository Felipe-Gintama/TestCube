import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { 
    GetAllTestCasesFromPlanController, 
    AddTestCaseToPlanController,
    RemoveTestFromPlanController
} from './test_plan_cases.controller';

const router = Router();

router.get('/:planId', authMiddleware, GetAllTestCasesFromPlanController);
router.post('/', authMiddleware, AddTestCaseToPlanController);
router.delete('/', authMiddleware, RemoveTestFromPlanController);

export default router