import { pool } from "../../config/db";
import bcrypt from "bcrypt";

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: string = "TESTER",
) {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id,name,email,role,password_hash",
    [name, email, hash, role],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1 AND deleted_at IS NULL",
    [email],
  );
  return result.rows[0];
}

export async function findUserById(id: number) {
  const result = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id=$1 AND deleted_at IS NULL",
    [id],
  );
  return result.rows[0];
}

export async function getAllUsers() {
  const result = await pool.query(
    "SELECT * FROM users WHERE deleted_at IS NULL",
  );
  return result.rows;
}

export async function deleteUserById(id: number) {
  const result = await pool.query(
    "UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
    [id],
  );

  return result.rows[0];
}

export async function updateUserRole(id: number, role: string) {
  const validRoles = ["ADMIN", "TESTER"];

  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const result = await pool.query(
    `UPDATE users
    SET role = $2
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name, email, role, created_at`,
    [id, role],
  );

  return result.rows[0];
}

export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
) {
  const result = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId],
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error("User not found");
  }

  const match = await bcrypt.compare(oldPassword, user.password_hash);
  if (!match) {
    throw new Error("Old password is incorrect");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    hash,
    userId,
  ]);

  return true;
}
