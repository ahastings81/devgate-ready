// frontend/src/pages/Invoices.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
}

interface TimeEntry {
  id: number;
  date: string;
  hours: number;
  description?: string;
  project: {
    id: number;
    title: string;
    rate?: number;
    clientId: number;
  };
}

interface Service {
  id: number;
  name: string;
  fee: number;
}

interface InvoiceSummary {
  id: number;
  date: string;
  amount: number;
  status?: string;
}

const IL_TAX_RATE = 0.0625;

const Invoices: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | ''>('');
  const [checkedEntryIds, setCheckedEntryIds] = useState<Set<number>>(new Set());
  const [checkedServiceIds, setCheckedServiceIds] = useState<Set<number>>(new Set());
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token');
  const { pathname } = useLocation();
  const creating = pathname.endsWith('/new');

  // fetch clients, services, and past invoices on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [cRes, sRes, iRes] = await Promise.all([
          fetch(`${apiUrl}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/services`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!cRes.ok) throw new Error(`Clients fetch failed: ${cRes.status}`);
        if (!sRes.ok) throw new Error(`Services fetch failed: ${sRes.status}`);
        if (!(iRes.ok || iRes.status === 404)) throw new Error(`Invoices fetch failed: ${iRes.status}`);

        setClients(await cRes.json());
        setServices(await sRes.json());
        if (iRes.ok) setInvoices(await iRes.json());
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [apiUrl, token]);

  // when a client is selected, fetch their time entries
  useEffect(() => {
    if (!token || !selectedClient) return;
    (async () => {
      try {
        const teRes = await fetch(`${apiUrl}/time-entries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!teRes.ok) throw new Error(`Entries fetch failed: ${teRes.status}`);
        const allEntries: TimeEntry[] = await teRes.json();
        setEntries(allEntries.filter(e => e.project.clientId === selectedClient));
        setCheckedEntryIds(new Set());
        setCheckedServiceIds(new Set());
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [apiUrl, token, selectedClient]);

  // toggle checkbox helpers
  const toggleEntry = (id: number) => {
    setCheckedEntryIds(prev => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });
  };
  const toggleService = (id: number) => {
    setCheckedServiceIds(prev => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });
  };

  // compute totals
  const timeSubtotal = entries
    .filter(e => checkedEntryIds.has(e.id))
    .reduce((sum, e) => sum + e.hours * (e.project.rate ?? 0), 0);

  const servicesTotal = services
    .filter(s => checkedServiceIds.has(s.id))
    .reduce((sum, s) => sum + s.fee, 0);

  const subtotal = timeSubtotal + servicesTotal;
  const tax = subtotal * IL_TAX_RATE;
  const total = subtotal + tax;

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Invoices</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!creating && (
        <>
          <Link
            to="/invoices/new"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary)',
              color: 'var(--text)',
              padding: '8px 16px',
              borderRadius: 4,
              textDecoration: 'none',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            + Create Invoice
          </Link>

          {invoices.length === 0 ? (
            <p>No invoices found.</p>
          ) : (
            <ul>
              {invoices.map(inv => (
                <li key={inv.id} style={{ marginBottom: 8 }}>
                  <Link
                    to={`/invoices/${inv.id}`}
                    style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                  >
                    #{inv.id} – {new Date(inv.date).toLocaleDateString()} – $
                    {inv.amount.toFixed(2)}
                  </Link>{' '}
                  {inv.status && `(${inv.status})`}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {creating && (
        <>
          <h2 style={{ marginTop: 0 }}>New Invoice</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ marginRight: 8 }}>Client:</label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(Number(e.target.value))}
            >
              <option value="">Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClient && entries.length === 0 && <p>This client has no time entries.</p>}

          {entries.length > 0 && (
            <>
              <h3>Time Entries</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const line = e.hours * (e.project.rate ?? 0);
                    return (
                      <tr key={e.id}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checkedEntryIds.has(e.id)}
                            onChange={() => toggleEntry(e.id)}
                          />
                        </td>
                        <td>{new Date(e.date).toLocaleDateString()}</td>
                        <td>{e.project.title}</td>
                        <td>{e.hours}</td>
                        <td>${(e.project.rate ?? 0).toFixed(2)}</td>
                        <td>${line.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h3 style={{ marginTop: 32, display: 'flex', alignItems: 'center' }}>
                One‑Time Services
                <Link
                  to="/services"
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    color: 'var(--primary)',
                    textDecoration: 'underline',
                  }}
                >
                  Manage Services
                </Link>
              </h3>

              {services.length === 0 ? (
                <p>No services defined.</p>
              ) : (
                <ul>
                  {services.map(s => (
                    <li key={s.id} style={{ marginBottom: 8 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checkedServiceIds.has(s.id)}
                          onChange={() => toggleService(s.id)}
                        />{' '}
                        {s.name} – ${s.fee.toFixed(2)}
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>IL Tax (6.25%): ${tax.toFixed(2)}</p>
                <p>
                  <strong>Total: ${total.toFixed(2)}</strong>
                </p>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${apiUrl}/invoices`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          timeEntryIds: [...checkedEntryIds],
                          serviceIds: [...checkedServiceIds],
                        }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || `Status ${res.status}`);
                      }
                      window.location.href = '/invoices';
                    } catch (e: any) {
                      console.error(e);
                      setError(e.message);
                    }
                  }}
                  disabled={checkedEntryIds.size === 0 && checkedServiceIds.size === 0}
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--text)',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 4,
                    cursor:
                      checkedEntryIds.size || checkedServiceIds.size
                        ? 'pointer'
                        : 'not-allowed',
                  }}
                >
                  Generate Invoice
                </button>
              </div>
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 32 }}>
        <Link to="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Invoices;
