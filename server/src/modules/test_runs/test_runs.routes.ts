import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  StartTestRunController,
  GetAllRunsController,
  AddUserToRunController,
  GetAllRunsForUserController,
} from "./test_runs.controller";

const router = Router();

router.post(
  "/start_run/:releaseId/:planId",
  authMiddleware,
  StartTestRunController
);

router.post("/addUser", authMiddleware, AddUserToRunController);
router.get("/getAll", authMiddleware, GetAllRunsController);
router.get("/getAll/:userId", authMiddleware, GetAllRunsForUserController);

export default router;
