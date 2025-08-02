// backend/src/routes/invoices.ts
import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// ─── Configure SMTP transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── GET /invoices ────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        invoiceEntries: { include: { timeEntry: { include: { project: { include: { client: true } } } } } },
        invoiceServices: { include: { service: true } },
      },
    });
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch invoices' });
  }
});

// ─── GET /invoices/:id ───────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        invoiceEntries: { include: { timeEntry: { include: { project: { include: { client: true } } } } } },
        invoiceServices: { include: { service: true } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch invoice' });
  }
});

// ─── GET /invoices/:id/pdf ───────────────────────────────────────────────────
router.get('/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        invoiceEntries: { include: { timeEntry: { include: { project: { include: { client: true } } } } } },
        invoiceServices: { include: { service: true } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // calculate totals
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

    // stream PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text(`Invoice #${invoice.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${invoice.date.toDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Time Entries', { underline: true });
    invoice.invoiceEntries.forEach(({ timeEntry }) => {
      doc
        .fontSize(10)
        .list([
          `${timeEntry.project.client.name} – ${timeEntry.project.title}: ${timeEntry.hours}h @ $${(
            timeEntry.project.rate ?? 0
          ).toFixed(2)} = $${(timeEntry.hours * (timeEntry.project.rate ?? 0)).toFixed(2)}`,
        ]);
    });
    doc.moveDown();

    doc.fontSize(14).text('One‑Time Services', { underline: true });
    invoice.invoiceServices.forEach(({ service }) => {
      doc.fontSize(10).list([`${service.name}: $${service.fee.toFixed(2)}`]);
    });
    doc.moveDown();

    doc.fontSize(12).text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`IL Tax (6.25%): $${tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Could not generate PDF' });
    else res.end();
  }
});

// ─── POST /invoices/:id/send ─────────────────────────────────────────────────
router.post('/:id/send', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        invoiceEntries: { include: { timeEntry: { include: { project: { include: { client: true } } } } } },
        invoiceServices: { include: { service: true } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Pick the client from the first time entry
    const firstEntry = invoice.invoiceEntries[0];
    if (!firstEntry) {
      return res.status(400).json({ error: 'No entries on this invoice' });
    }
    const client = firstEntry.timeEntry.project.client;

    // *** Fix: extract contactEmail after null‑check ***
    const contactEmail = client.contact;
    if (!contactEmail) {
      return res.status(400).json({ error: 'Client has no contact email' });
    }

    // Build PDF in memory
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Send email with attachment
      const fromEmail = process.env.EMAIL_FROM || 'no-reply@example.com';
      await transporter.sendMail({
        from: fromEmail,
        to: contactEmail,            // now safely a string
        subject: `Invoice #${invoice.id}`,
        text: `Hello ${client.name},\n\nPlease find attached your invoice #${invoice.id}.\n\nThanks!`,
        attachments: [
          {
            filename: `invoice-${invoice.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      res.json({ success: true, message: `Invoice emailed to ${contactEmail}` });
    });

    // Write the PDF contents (same as /pdf route)…
    doc.fontSize(20).text(`Invoice #${invoice.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${invoice.date.toDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Time Entries', { underline: true });
    invoice.invoiceEntries.forEach(({ timeEntry }) => {
      doc.fontSize(10).list([
        `${timeEntry.project.title}: ${timeEntry.hours}h @ $${(
          timeEntry.project.rate ?? 0
        ).toFixed(2)} = $${(timeEntry.hours * (timeEntry.project.rate ?? 0)).toFixed(2)}`,
      ]);
    });
    doc.moveDown();

    doc.fontSize(14).text('One‑Time Services', { underline: true });
    invoice.invoiceServices.forEach(({ service }) => {
      doc.fontSize(10).list([`${service.name}: $${service.fee.toFixed(2)}`]);
    });
    doc.moveDown();

    // Totals
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

    doc.fontSize(12).text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`IL Tax (6.25%): $${tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to send invoice email' });
  }
});

// ─── POST /invoices ───────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
  // …your existing create‑invoice logic here…
});

export default router;