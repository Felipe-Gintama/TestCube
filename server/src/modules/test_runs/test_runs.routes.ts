import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  StartTestRunController,
  GetAllRunsController,
  AddUserToRunController,
  GetAllRunsForUserController,
  AssignUserToTestsController,
  RemoveAssignmentController,
  FinishTestCaseController,
  FinishTestRunController,
} from "./test_runs.controller";

const router = Router();

router.post(
  "/start_run/:releaseId/:planId",
  authMiddleware,
  StartTestRunController
);

router.post("/addUser", authMiddleware, AddUserToRunController);
router.post("/assignUserToTests", authMiddleware, AssignUserToTestsController);
router.post("/removeAssignments", authMiddleware, RemoveAssignmentController);
router.post("/finishTestCase", authMiddleware, FinishTestCaseController);
router.get("/getAll", authMiddleware, GetAllRunsController);
router.get("/getAll/:userId", authMiddleware, GetAllRunsForUserController);
router.post("/:runId/finish", authMiddleware, FinishTestRunController);

export default router;
