// frontend/src/pages/Projects.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
  contact?: string;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  rate?: number;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  clientId: number;
  client: Client;
}

const Projects: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    rate: '',
    dueDate: '',
    clientId: '',
  });
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('devgate_token');
  const apiUrl = import.meta.env.VITE_API_URL;

  // Load clients & projects on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          fetch(`${apiUrl}/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!clientsRes.ok) throw new Error(`Clients fetch failed: ${clientsRes.status}`);
        if (!projectsRes.ok) throw new Error(`Projects fetch failed: ${projectsRes.status}`);

        const clientsData: Client[] = await clientsRes.json();
        const projectsData: Project[] = await projectsRes.json();
        setClients(clientsData);
        setProjects(projectsData);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [apiUrl, token]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new project
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        dueDate: form.dueDate ? `${form.dueDate}T00:00:00.000Z` : undefined,
        clientId: Number(form.clientId),
      };
      const res = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Status ${res.status}`);
      }
      const newProject: Project = await res.json();
      setProjects(prev => [...prev, newProject]);
      setForm({ title: '', description: '', rate: '', dueDate: '', clientId: '' });
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Edit existing project
  const handleEdit = async (p: Project) => {
    const title = prompt('Project title', p.title);
    if (title == null) return;
    const description = prompt('Description', p.description || '') || '';
    const rateStr = prompt('Rate', p.rate?.toString() || '') || '';
    const dueDateInput =
      prompt('Due Date (YYYY-MM-DD)', p.dueDate?.split('T')[0] || '') || '';
    const clientIdStr = prompt('Client ID', p.clientId.toString()) || '';

    try {
      const payload: any = {
        title,
        description: description || undefined,
        rate: rateStr ? Number(rateStr) : undefined,
        dueDate: dueDateInput ? `${dueDateInput}T00:00:00.000Z` : undefined,
        clientId: clientIdStr ? Number(clientIdStr) : undefined,
      };
      const res = await fetch(`${apiUrl}/projects/${p.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const updated: Project = await res.json();
      setProjects(prev => prev.map(x => (x.id === p.id ? updated : x)));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Delete a project
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    try {
      const res = await fetch(`${apiUrl}/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Mark as completed
  const handleComplete = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/projects/${id}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Complete failed: ${res.status}`);
      const updated: Project = await res.json();
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Reactivate a completed project
  const handleReactivate = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/projects/${id}/reactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Reactivate failed: ${res.status}`);
      const updated: Project = await res.json();
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
  };

  // Group by client name
  const byClient: Record<string, Project[]> = {};
  projects.forEach(p => {
    const name = p.client.name;
    byClient[name] = byClient[name] || [];
    byClient[name].push(p);
  });

  // Split active vs completed
  const activeByClient: Record<string, Project[]> = {};
  const completedByClient: Record<string, Project[]> = {};
  Object.entries(byClient).forEach(([clientName, list]) => {
    activeByClient[clientName] = list
      .filter(p => !p.completed)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate!).getTime();
      });

    completedByClient[clientName] = list
      .filter(p => p.completed)
      .sort((a, b) => {
        return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime();
      });
  });

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Your Projects</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Add Project Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 32 }}>
        <input
          name="title"
          placeholder="Project Title"
          value={form.title}
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
          placeholder="Description"
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
        <input
          name="rate"
          type="number"
          placeholder="Rate"
          value={form.rate}
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
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="dueDate" style={{ display: 'block', marginBottom: 4 }}>
            Due Date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text)',
            }}
          />
        </div>
        <select
          name="clientId"
          value={form.clientId}
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
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
          Add Project
        </button>
      </form>

      {/* Active Projects */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Active Projects</h2>
        {Object.entries(activeByClient).map(([clientName, list]) =>
          list.length > 0 ? (
            <div key={clientName} style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 8 }}>{clientName}</h3>
              {list.map(p => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{p.title}</strong>
                    {p.dueDate && (
                      <p style={{ margin: '4px 0' }}>
                        Due: {new Date(p.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {p.description && <p style={{ margin: '4px 0' }}>{p.description}</p>}
                    {p.rate != null && (
                      <p style={{ margin: '4px 0' }}>Rate: ${p.rate.toFixed(2)}</p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleEdit(p)}
                      style={{
                        marginRight: 8,
                        background: 'none',
                        border: '1px solid var(--secondary)',
                        color: 'var(--secondary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleComplete(p.id)}
                      style={{
                        marginRight: 8,
                        background: 'none',
                        border: '1px solid green',
                        color: 'green',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Done
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )}
      </section>

      {/* Completed Projects */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Completed Projects</h2>
        {Object.entries(completedByClient).map(([clientName, list]) =>
          list.length > 0 ? (
            <div key={clientName} style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 8 }}>{clientName}</h3>
              {list.map(p => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 4,
                    opacity: 0.7,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ textDecoration: 'line-through' }}>
                      {p.title}
                    </strong>
                    {p.completedAt && (
                      <p style={{ margin: '4px 0', fontStyle: 'italic', fontSize: 12 }}>
                        Completed on {new Date(p.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleReactivate(p.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )}
      </section>

      {/* Back to Dashboard */}
      <div style={{ marginTop: 32 }}>
        <Link
          to="/dashboard"
          style={{ color: 'var(--primary)', textDecoration: 'underline' }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Projects;
