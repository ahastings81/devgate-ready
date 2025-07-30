import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
  contact?: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const token = localStorage.getItem('devgate_token');

  // Fetch clients on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setClients)
      .catch(console.error);
  }, [token]);

  // Add a client
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, contact }),
      });
      const newClient = await res.json();
      setClients(prev => [...prev, newClient]);
      setName('');
      setContact('');
    } catch (err) {
      console.error(err);
    }
  };

  // Edit a client
  const handleEdit = async (c: Client) => {
    const newName = prompt('Client name', c.name);
    if (newName == null) return;
    const newContact = prompt('Contact info', c.contact || '') || '';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients/${c.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName, contact: newContact }),
      });
      if (res.ok) {
        setClients(prev =>
          prev.map(x =>
            x.id === c.id ? { ...x, name: newName, contact: newContact } : x
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a client
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Your Clients</h1>

      {/* Add Client Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Client Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            padding: 8,
            marginBottom: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text)',
          }}
        />
        <input
          type="text"
          placeholder="Contact Info"
          value={contact}
          onChange={e => setContact(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            padding: 8,
            marginBottom: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text)',
          }}
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

      {/* Clients List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {clients.map(c => (
          <li
            key={c.id}
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              padding: 12,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>{c.name}</strong>
              {c.contact && (
                <p style={{ margin: 0, color: 'var(--text)' }}>{c.contact}</p>
              )}
            </div>
            <div>
              <button
                onClick={() => handleEdit(c)}
                style={{
                  marginRight: 8,
                  background: 'none',
                  border: '1px solid var(--secondary)',
                  color: 'var(--secondary)',
                  padding: '4px 8px',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  background: 'none',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '4px 8px',
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Back to Dashboard */}
      <div style={{ marginTop: 24 }}>
        <Link
          to="/dashboard"
          style={{
            color: 'var(--primary)',
            textDecoration: 'underline',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Clients;
