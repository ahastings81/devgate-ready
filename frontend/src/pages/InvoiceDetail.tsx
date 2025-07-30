// frontend/src/pages/InvoiceDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Invoice {
  id: number;
  date: string;
  amount: number;
  status?: string;
  invoiceEntries: {
    timeEntry: {
      id: number;
      date: string;
      hours: number;
      project: { title: string; rate?: number; client: { name: string; contact: string } };
    };
  }[];
  invoiceServices: {
    service: { id: number; name: string; fee: number };
  }[];
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token');

  useEffect(() => {
    if (!token || !id) return;
    fetch(`${apiUrl}/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then(setInvoice)
      .catch(e => setError(e.message));
  }, [apiUrl, token, id]);

  const handleDownloadPdf = async () => {
    if (!token || !id) {
      setError('Missing auth or invoice ID');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PDF error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSendEmail = async () => {
    if (!token || !id) return;
    setSending(true);
    setSentMsg(null);
    try {
      const res = await fetch(`${apiUrl}/invoices/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
      setSentMsg(data.message || 'Email sent successfully!');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (error) return <p style={{ color: 'red', padding: 16 }}>Error: {error}</p>;
  if (!invoice) return <p style={{ padding: 16 }}>Loading…</p>;

  const timeTotal = invoice.invoiceEntries.reduce(
    (sum, ie) => sum + ie.timeEntry.hours * (ie.timeEntry.project.rate ?? 0),
    0
  );
  const servicesTotal = invoice.invoiceServices.reduce(
    (sum, isv) => sum + isv.service.fee,
    0
  );
  const subtotal = timeTotal + servicesTotal;
  const tax = subtotal * 0.0625;
  const total = subtotal + tax;

  const client = invoice.invoiceEntries[0].timeEntry.project.client;

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h1>Invoice #{invoice.id}</h1>
      <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
      {invoice.status && <p>Status: {invoice.status}</p>}
      <p>Client: {client.name}</p>
      <p>Contact: {client.contact}</p>

      <h2 style={{ marginTop: 24 }}>Time Entries</h2>
      <ul>
        {invoice.invoiceEntries.map(({ timeEntry }) => {
          const line = timeEntry.hours * (timeEntry.project.rate ?? 0);
          return (
            <li key={timeEntry.id}>
              {timeEntry.project.title} – {timeEntry.hours}h @ $
              {(timeEntry.project.rate ?? 0).toFixed(2)} = ${line.toFixed(2)}
            </li>
          );
        })}
      </ul>

      <h2 style={{ marginTop: 24 }}>One‑Time Services</h2>
      <ul>
        {invoice.invoiceServices.map(({ service }) => (
          <li key={service.id}>
            {service.name} – ${service.fee.toFixed(2)}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>IL Tax (6.25%): ${tax.toFixed(2)}</p>
        <p style={{ fontSize: 18, fontWeight: 'bold' }}>Total: ${total.toFixed(2)}</p>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={handleDownloadPdf}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text)',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Download PDF
        </button>

        <button
          onClick={handleSendEmail}
          disabled={sending}
          style={{
            backgroundColor: sending ? 'gray' : 'var(--secondary)',
            color: 'var(--text)',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending…' : 'Send Invoice'}
        </button>
      </div>

      {sentMsg && <p style={{ color: 'green', marginTop: 12 }}>{sentMsg}</p>}

      <div style={{ marginTop: 32 }}>
        <Link to="/invoices" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          ← Back to Invoices
        </Link>
      </div>
    </div>
  );
};

export default InvoiceDetail;
