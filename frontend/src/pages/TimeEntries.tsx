// frontend/src/pages/TimeEntries.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  title: string;
  client: Client;
}

interface TimeEntry {
  id: number;
  date: string;
  hours: number;
  description?: string;
  project: Project;
}

const TimeEntries: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [form, setForm] = useState({
    projectId: '',
    date: '',
    hours: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('devgate_token');

  // Fetch projects and entries
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [projRes, entriesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/time-entries`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!projRes.ok) throw new Error(`Projects fetch failed: ${projRes.status}`);
        if (!entriesRes.ok) throw new Error(`Entries fetch failed: ${entriesRes.status}`);
        const projData: Project[] = await projRes.json();
        const entriesData: TimeEntry[] = await entriesRes.json();
        setProjects(projData);
        // sort by date desc
        setEntries(entriesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        projectId: Number(form.projectId),
        date: `${form.date}T00:00:00`,
        hours: Number(form.hours),
        description: form.description || undefined,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Status ${res.status}`);
      }
      const newEntry: TimeEntry = await res.json();
      setEntries(prev => [newEntry, ...prev]);
      setForm({ projectId: '', date: '', hours: '', description: '' });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/time-entries/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Time Entries</h1>
      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>Error: {error}</p>
      )}

      {/* Add Time Entry Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <select
          name="projectId"
          value={form.projectId}
          onChange={handleChange}
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
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.client.name} / {p.title}
            </option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
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
          name="hours"
          type="number"
          step="0.25"
          placeholder="Hours"
          value={form.hours}
          onChange={handleChange}
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
          name="description"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleChange}
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
          Add Entry
        </button>
      </form>

      {/* Entries List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {entries.map(e => (
          <li
            key={e.id}
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
              <strong>
                {new Date(e.date).toLocaleDateString()} – {e.project.client.name} / {e.project.title}
              </strong>
              <p style={{ margin: '4px 0 0' }}>
                {e.hours} hrs{e.description ? ` • ${e.description}` : ''}
              </p>
            </div>
            <button
              onClick={() => handleDelete(e.id)}
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

export default TimeEntries;
