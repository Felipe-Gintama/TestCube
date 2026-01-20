import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  getAllUserProjects,
  createNewProject,
  editProject,
  deleteProject,
  allMembersOfProject,
  addMemeberToProject,
  deleteMemberFromProject,
} from "./projects.controller";

const router = Router();

router.get("/", authMiddleware, authMiddleware, getAllUserProjects);
router.get("/:id", authMiddleware, allMembersOfProject);
router.post("/", authMiddleware, createNewProject);
router.post("/:projectId/members/:userId", authMiddleware, addMemeberToProject);
router.put("/:id", authMiddleware, editProject);
router.delete("/:id", authMiddleware, deleteProject);
router.delete(
  "/:projectId/members/:userId",
  authMiddleware,
  deleteMemberFromProject,
);

export default router;
