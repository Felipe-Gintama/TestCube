import { Router } from "express";
import {
  changePasswordController,
  deleteUser,
  GetAllUsers,
  register,
  updateUserRoleController,
} from "./users.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, GetAllUsers);
router.post("/register", register);
router.put("/:id/delete", authMiddleware, deleteUser);
router.put("/:id/role", authMiddleware, updateUserRoleController);
router.put("/change-password", authMiddleware, changePasswordController);

export default router;
