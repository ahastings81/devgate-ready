// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

// Utility: decode the JWT and grab the email local‐part
const getUserName = (): string => {
  const token = localStorage.getItem('devgate_token') || '';
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    // base64 URL → padded base64
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

const Dashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token');

  // Dynamic greeting based on local time
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Load clients + metrics
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(`${apiUrl}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/dashboard/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!cRes.ok) throw new Error(`Clients load failed: ${cRes.status}`);
        if (!mRes.ok) throw new Error(`Metrics load failed: ${mRes.status}`);

        setClients(await cRes.json());
        setMetrics(await mRes.json());
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [apiUrl, token]);

  // Create new client
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/clients`, {
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
      const res = await fetch(`${apiUrl}/clients/${id}`, {
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

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Personalized Greeting */}
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>
        {greeting()}, {getUserName() || 'there'}!
      </h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Metrics Cards */}
      {metrics ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>Unbilled Hours</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>
              {metrics.unbilledHours.toFixed(2)}h
            </p>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>Unbilled Amount</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>
              ${metrics.unbilledAmount.toFixed(2)}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>Outstanding Invoices</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>
              {metrics.outstandingInvoices}
            </p>
            <p style={{ margin: 0, fontSize: 14, marginTop: 4 }}>
              ${metrics.outstandingAmount.toFixed(2)}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>Revenue This Month</p>
            <p style={{ fontSize: 24, marginTop: 4 }}>
              ${metrics.revenueThisMonth.toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <p>Loading metrics…</p>
      )}

      {/* Clients Management (unchanged) */}
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

      <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
        <Link to="/projects" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          + Add / View Projects
        </Link>
        <Link to="/time-entries" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          + Log Time
        </Link>
        <Link to="/invoices" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          View Invoices
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
