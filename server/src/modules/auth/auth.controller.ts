import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { findUserByEmail, findUserById } from "../users/users.service";
import { generateToken } from "./auth.service";
import { AuthRequest } from "../../middlewares/authMiddleware";

export async function login(req: Request, res: Response) {
    const {email, password} = req.body;
    
    const user = await findUserByEmail(email);

    console.log("User: ", user);

    if (!user) 
        return res.status(401).json({error: 'Invalid email or password'});

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
        return res.status(401).json({error: 'Invalid email or password'});

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

export async function getMe(req: AuthRequest, res: Response) {
    
    if (!req.user) {
        return res.status(401).json({ error: 'Nieautoryzowany' });
    }
    
    const user = await findUserById(req.user.userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
}