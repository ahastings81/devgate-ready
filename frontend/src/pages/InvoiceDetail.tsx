// frontend/src/pages/InvoiceDetail.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Client   { id: number; name: string; }
interface TimeEntry {
  id: number;
  date: string;
  hours: number;
  rate: number;
  description?: string;
}
interface Service {
  id: number;
  description: string;
  price: number;
}

const InvoiceDetail: React.FC = () => {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('devgate_token')!;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [clients,    setClients]    = useState<Client[]>([]);
  const [clientId,   setClientId]   = useState<number>(Number(id) || 0);
  const [entries,    setEntries]    = useState<TimeEntry[]>([]);
  const [services,   setServices]   = useState<Service[]>([]);
  const [selEntries, setSelEntries]   = useState<Set<number>>(new Set());
  const [selServices,setSelServices]  = useState<Set<number>>(new Set());
  const [invoiceId,  setInvoiceId]  = useState<number | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // load clients
  useEffect(() => {
    fetch(`${API}/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setClients)
      .catch(console.error);
  }, []);

  // whenever clientId changes, pull from the global endpoints:
  useEffect(() => {
    if (!clientId) {
      setEntries([]);
      setServices([]);
      return;
    }

    // time entries: GET /time-entries?clientId=…&unbilled=true
    fetch(
      `${API}/time-entries?clientId=${clientId}&unbilled=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.json())
      .then((data: any[]) => {
        // normalize to match our interface (pull .project.rate)
        const normalized = data.map(e => ({
          id:          e.id,
          date:        e.date,
          hours:       e.hours,
          rate:        e.project?.rate ?? 0,
          description: e.description
        }));
        setEntries(normalized);
        setSelEntries(new Set());
      })
      .catch(console.error);

    // services: GET /services?clientId=…&unbilled=true
    fetch(
      `${API}/services?clientId=${clientId}&unbilled=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.json())
      .then((data: any[]) => {
        // normalize (fee → price)
        const normalized = data.map(s => ({
          id:          s.id,
          description: s.name || s.description,
          price:       s.fee ?? 0
        }));
        setServices(normalized);
        setSelServices(new Set());
      })
      .catch(console.error);

  }, [clientId]);

  // toggle helpers
  const toggle = (
    set:    Set<number>,
    id:     number,
    updater: React.Dispatch<Set<number>>
  ) => {
    const s = new Set(set);
    s.has(id) ? s.delete(id) : s.add(id);
    updater(s);
  };

  // compute subtotal / tax / total
  const lineItems = [
    ...entries.filter(e => selEntries.has(e.id)).map(e => e.hours * e.rate),
    ...services.filter(s => selServices.has(s.id)).map(s => s.price)
  ];
  const subtotal = lineItems.reduce((a, b) => a + b, 0);
  const tax      = +(subtotal * 0.0625).toFixed(2);
  const total    = +(subtotal + tax).toFixed(2);

  // create invoice
  const handleCreate = async () => {
    const res = await fetch(`${API}/invoices`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({
         clientId,
         timeEntryIds: Array.from(selEntries),
         serviceIds: Array.from(selServices),
       }),
    });
    if (!res.ok) return alert('Create failed');
    const inv = await res.json();
    setInvoiceId(inv.id);
  };

  // export PDF
  const handlePdf = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current);
    const img    = canvas.toDataURL('image/png');
    const pdf    = new jsPDF('p','pt','a4');
    const w      = pdf.internal.pageSize.getWidth();
    const h      = (canvas.height * w) / canvas.width;
    pdf.addImage(img,'PNG',0,0,w,h);
    pdf.save(`invoice-${invoiceId||'new'}.pdf`);
  };

  // send email
  const handleEmail = async () => {
    if (!invoiceId) return;
    const res = await fetch(`${API}/invoices/${invoiceId}/send-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    res.ok ? alert('Email sent!') : alert('Email failed');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{invoiceId ? `Invoice #${invoiceId}` : 'Create Invoice'}</h1>

      {/* Client selector */}
      <div>
        <label>
          Client:{' '}
          <select value={clientId} onChange={e => setClientId(Number(e.target.value))}>
            <option value={0}>-- pick one --</option>
            {clients.map(c =>
              <option key={c.id} value={c.id}>{c.name}</option>
            )}
          </select>
        </label>
        <Link to="/services" style={{ marginLeft: 20 }}>+ Add Service</Link>
      </div>

      {/* Invoice preview */}
      <div
        ref={invoiceRef}
        style={{ marginTop: 20, padding: 20, border: '1px solid #ccc' }}
      >
        <h2>Line Items</h2>
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th></th>
              <th>Date/Desc</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Rate</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e =>
              <tr key={e.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selEntries.has(e.id)}
                    onChange={() => toggle(selEntries, e.id, setSelEntries)}
                  />
                </td>
                <td>{new Date(e.date).toLocaleDateString()} {e.description}</td>
                <td style={{ textAlign: 'right' }}>{e.hours.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>${e.rate.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>${(e.hours*e.rate).toFixed(2)}</td>
              </tr>
            )}
            {services.map(s =>
              <tr key={`svc-${s.id}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selServices.has(s.id)}
                    onChange={() => toggle(selServices, s.id, setSelServices)}
                  />
                </td>
                <td>{s.description}</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>${s.price.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>${s.price.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 500 }}>Subtotal</td>
              <td style={{ textAlign: 'right' }}>${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 500 }}>IL Tax (6.25%)</td>
              <td style={{ textAlign: 'right' }}>${tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 20 }}>
        {!invoiceId
          ? <button onClick={handleCreate}>Create Invoice</button>
          : <>
              <button onClick={handlePdf} style={{ marginRight:10 }}>Save PDF</button>
              <button onClick={handleEmail}>Send Email</button>
            </>
        }
        <button onClick={() => navigate(-1)} style={{ marginLeft: 20 }}>Back</button>
      </div>
    </div>
  );
};

export default InvoiceDetail;
