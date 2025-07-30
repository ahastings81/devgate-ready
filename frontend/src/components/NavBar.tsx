import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/devgate-loader.png';

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear stored JWT
    localStorage.removeItem('devgate_token');
    // Redirect to login
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
      <div style={{ display: 'flex', gap: 12 }}>
        <img src={logo} alt="DevGate logo" style={{ height: 32 }} />
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          Dashboard
        </Link>
        <Link to="/clients" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          Clients
        </Link>
        <Link to="/projects" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          Projects
        </Link>
        <Link to="/time-entries" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          Time Entries
        </Link>
        <Link to="/invoices" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          Invoices
        </Link>
      </div>
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
    </nav>
  );
};

export default NavBar;
