export async function loginUser(email: string, password: string) {
    const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok)
        throw new Error('Login failed');

    return res.json();
}

export async function registerUser(name: string, email: string, password: string) {
    const res = await fetch('http://localhost:4000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    if (!res.ok)
        throw new Error('Registration failed');

    return res.json();
}