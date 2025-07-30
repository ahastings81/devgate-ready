import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Service {
  id: number;
  name: string;
  description?: string;
  fee: number;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', description: '', fee: '' });
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token');

  // load services
  useEffect(() => {
    if (!token) return;
    fetch(`${apiUrl}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setServices)
      .catch(e => {
        console.error(e);
        setError(e.message);
      });
  }, [apiUrl, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          fee: Number(form.fee),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Status ${res.status}`);
      }
      const svc: Service = await res.json();
      setServices(prev => [svc, ...prev]);
      setForm({ name: '', description: '', fee: '' });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    try {
      const res = await fetch(`${apiUrl}/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Services (One‑Time Fees)</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <input
          name="name"
          placeholder="Service Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%' }}
        />
        <input
          name="description"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleChange}
          style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%' }}
        />
        <input
          name="fee"
          type="number"
          placeholder="Fee (e.g. 250.00)"
          value={form.fee}
          onChange={handleChange}
          required
          style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%' }}
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
          + Add Service
        </button>
      </form>

      {services.length === 0 ? (
        <p>No services defined yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Fee</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.description}</td>
                <td>${s.fee.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 32 }}>
        <Link to="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Services;
