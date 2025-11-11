import {pool} from '../../config/db';
import bcrypt from 'bcrypt';

export async function createUser(name: string, email: string, password: string, role: string = 'tester') {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id,name,email,role,password_hash',
        [name, email, hash, role]
    );
    return result.rows[0];
}

export async function findUserByEmail(email: string) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email=$1', [email]        
    );
    return result.rows[0];
}

export async function findUserById(id: number) {
    const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id=$1', [id]
    );
  return result.rows[0];
}

export async function getAllUsers() {
    const result = await pool.query(
        'SELECT * FROM users'
    );
  return result.rows;
}