import { Router } from 'express'
import { getTestCases } from './controller'

const router = Router()
router.get('/', getTestCases)

export default router
