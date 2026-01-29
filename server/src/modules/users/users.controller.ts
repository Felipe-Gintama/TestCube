import { Request, Response } from "express";
import {
  changePassword,
  createUser,
  deleteUserById,
  getAllUsers,
  updateUserRole,
} from "./users.service";
import { AuthRequest } from "../../middlewares/authMiddleware";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await createUser(name, email, password);
    console.log("User created", user);
    return res.status(201).json(user);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Nie udało się zarejestrować użytkownika" });
  }
}

export async function GetAllUsers(req: AuthRequest, res: Response) {
  try {
    const result = await getAllUsers();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const userIdToDelete = Number(req.params.id);

  if (isNaN(userIdToDelete)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const loggedUser = req.user;
  if (!loggedUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId: loggedUserId, role } = loggedUser;

  if (role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (userIdToDelete === loggedUserId) {
    return res
      .status(400)
      .json({ error: "You cannot delete your own account" });
  }

  try {
    const deleted = await deleteUserById(userIdToDelete);

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "User not found or already deleted" });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("DELETE USER ERROR:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUserRoleController(
  req: AuthRequest,
  res: Response,
) {
  const userIdToUpdate = Number(req.params.id);
  const { role } = req.body;

  if (isNaN(userIdToUpdate)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const loggedUser = req.user;
  if (!loggedUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (loggedUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const updatedUser = await updateUserRole(userIdToUpdate, role);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found or deleted" });
    }

    return res.status(200).json(updatedUser);
  } catch (err: any) {
    console.error("UPDATE USER ROLE ERROR:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function changePasswordController(
  req: AuthRequest,
  res: Response,
) {
  const userId = req.user?.userId;
  const { oldPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Old and new passwords are required" });
  }

  try {
    await changePassword(userId, oldPassword, newPassword);
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err: any) {
    console.error("CHANGE PASSWORD ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }
}
