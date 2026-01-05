import { Router } from "express";
import { getMe, login } from "./auth.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
