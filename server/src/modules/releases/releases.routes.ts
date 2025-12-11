import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { 
    CreateReleaseController, 
    DeleteReleaseController, 
    GetReleasesController
} from './releases.controller'

const router = Router();

router.get('/:projectId', authMiddleware, GetReleasesController);
router.post('/new', authMiddleware, CreateReleaseController);
router.delete('/:releaseId', DeleteReleaseController);

export default router