import {Request, Response} from 'express';
import { createUser } from './users.service';

export async function register (req: Request, res: Response) {
    const { name, email, password } = req.body;

    try {
        const user = await createUser(name, email, password);
        res.status(201).json(user);
    }
    catch (err: any){
        console.error(err);
        res.status(400).json({ error: 'Nie udało się zarejestrować użytkownika' });
    }
};