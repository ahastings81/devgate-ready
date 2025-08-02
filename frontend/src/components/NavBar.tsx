// frontend/src/components/NavBar.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/devgate-loader.png';
import avatarPlaceholder from '../assets/avatar-placeholder.png';
import ThemeSwitcher from './ThemeSwitcher';
import '../index.css';

interface UserProfile {
  email: string;
  profilePic: string | null;
}

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const token = localStorage.getItem('devgate_token');
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
        return res.json();
      })
      .then((u: UserProfile) => setProfile(u))
      .catch(err => console.error('NavBar profile load error:', err));
  }, [API, token]);

  const avatarUrl = profile?.profilePic ? `${API}${profile.profilePic}` : avatarPlaceholder;

  const handleLogout = () => {
    localStorage.removeItem('devgate_token');
    navigate('/login', { replace: true });
  };

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logo} alt="DevGate logo" style={{ height: 32 }} />
        <Link to="/dashboard" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Link to="/clients" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          Clients
        </Link>
        <Link to="/projects" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          Projects
        </Link>
        <Link to="/time-entries" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          Time Entries
        </Link>
        <Link to="/invoices" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          Invoices
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeSwitcher />

        <img
          src={avatarUrl}
          alt="Profile"
          onClick={() => navigate('/profile')}
          style={{
            height: 32,
            width: 32,
            borderRadius: '50%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />

        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid var(--secondary)',
            color: 'var(--secondary)',
            padding: '4px 12px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
