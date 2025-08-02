// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import avatarPlaceholder from '../assets/avatar-placeholder.png';

interface UserProfile {
  email: string;
  profilePic: string | null;
}

interface Client {
  id: number;
  name: string;
  contact?: string;
}

interface Metrics {
  unbilledHours: number;
  unbilledAmount: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  revenueThisMonth: number;
}

interface Project {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  client: { name: string };
}

const getUserName = (): string => {
  const token = localStorage.getItem('devgate_token') || '';
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    const b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      window
        .atob(b)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { email } = JSON.parse(json) as { email: string };
    return email.split('@')[0];
  } catch {
    return '';
  }
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [upcoming, setUpcoming] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token');

  // Load profile (for avatar)
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users/me`, {                           // <-- back to /users/me
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
        return res.json();
      })
      .then((u: UserProfile) => setProfile(u))
      .catch(err => console.error('Dashboard profile load error:', err));
  }, [API, token]);

  // Load clients, metrics, projects, and compute upcoming
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [cRes, mRes, pRes] = await Promise.all([
          fetch(`${API}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }), // <-- back to /dashboard/metrics
          fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!cRes.ok) throw new Error(`Clients load failed: ${cRes.status}`);
        if (!mRes.ok) throw new Error(`Metrics load failed: ${mRes.status}`);
        if (!pRes.ok) throw new Error(`Projects load failed: ${pRes.status}`);

        const [cData, mData, pData] = await Promise.all([cRes.json(), mRes.json(), pRes.json()]);
        setClients(cData);
        setMetrics(mData);
        setProjects(pData);

        // filter next 7 days
        const now = new Date();
        const week = new Date();
        week.setDate(now.getDate() + 7);
        const upcomingList = (pData as Project[])
          .filter(p => !p.completed && p.dueDate)
          .filter(p => {
            const d = new Date(p.dueDate!);
            return d >= now && d <= week;
          });
        setUpcoming(upcomingList);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [API, token]);

  // Create new client
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, contact }),
      });
      if (!res.ok) throw new Error(`Create client failed: ${res.status}`);
      const newClient = await res.json();
      setClients(prev => [...prev, newClient]);
      setName('');
      setContact('');
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Delete client
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client?')) return;
    try {
      const res = await fetch(`${API}/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const avatarUrl = profile?.profilePic ? `${API}${profile.profilePic}` : avatarPlaceholder;

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      {/* Greeting + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }}
        />
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
          {greeting()}, {getUserName() || 'there'}!
        </h1>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Metrics */}
      {metrics ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={{ padding: 16, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Unbilled Hours</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>{metrics.unbilledHours.toFixed(2)}h</p>
          </div>
          <div style={{ padding: 16, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Unbilled Amount</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>${metrics.unbilledAmount.toFixed(2)}</p>
          </div>
          <div style={{ padding: 16, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Outstanding Invoices</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>{metrics.outstandingInvoices}</p>
            <p style={{ margin: 0, fontSize: 14, marginTop: 4 }}>${metrics.outstandingAmount.toFixed(2)}</p>
          </div>
          <div style={{ padding: 16, backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Revenue This Month</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>${metrics.revenueThisMonth.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        <p>Loading metrics…</p>
      )}

      {/* Upcoming Deadlines */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Upcoming Deadlines (next 7 days)</h2>
        {upcoming.length ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {upcoming.map(p => (
              <li
                key={p.id}
                style={{
                  padding: 12,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              >
                <strong>{p.title}</strong> for <em>{p.client.name}</em>
                <span style={{ float: 'right' }}>
                  Due {new Date(p.dueDate!).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming deadlines</p>
        )}
      </div>

      {/* Clients Management */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Your Clients</h2>
      <form onSubmit={handleAdd} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          placeholder="Client Name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid var(--border)', borderRadius: 4 }}
        />
        <input
          placeholder="Contact Info"
          value={contact}
          onChange={e => setContact(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid var(--border)', borderRadius: 4 }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text)',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Add Client
        </button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {clients.map(c => (
          <li
            key={c.id}
            style={{
              padding: 12,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            <div>
              <strong>{c.name}</strong>
              {c.contact && <p style={{ margin: '4px 0' }}>{c.contact}</p>}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link
                to={`/clients/${c.id}/edit`}
                style={{ marginRight: 12, color: 'var(--primary)', textDecoration: 'underline' }}
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Quick Actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
        <Link to="/projects" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          + Add / View Projects
        </Link>
        <Link to="/time-entries" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          + Log Time
        </Link>
        <Link to="/invoices/new" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          + Create Invoice
        </Link>
        <Link to="/invoices" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          View Invoices
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
