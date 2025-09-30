import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { findUserByEmail } from "../users/users.service";
import { generateToken } from "./auth.service";
import { AuthRequest } from "../../middlewares/authMiddleware";

export async function login(req: Request, res: Response) {
    const {email, password} = req.body;
    
    const user = await findUserByEmail(email);

    //console.log(user.password_hash);

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
    res.json({ user: req.user });
}