import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string|null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1️⃣ Create the user
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Signup failed: ${res.status}`);
      }
      // you get back { id, email }
      // 2️⃣ Now immediately log in to get the JWT
      const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        const body = await loginRes.json().catch(() => ({}));
        throw new Error(body.error || `Login failed: ${loginRes.status}`);
      }
      const { token } = await loginRes.json();
      localStorage.setItem('devgate_token', token);

      // redirect into the app
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16 }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>
          Sign Up &amp; Log In
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default Signup;
