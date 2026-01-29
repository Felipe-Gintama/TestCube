import { Router } from "express";
import { createGithubIssue } from "./github.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/issues", authMiddleware, createGithubIssue);

export default router;
