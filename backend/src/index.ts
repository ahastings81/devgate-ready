// backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';

import authRoutes from './routes/auth';
import clientsRoutes from './routes/clients';
import projectsRoutes from './routes/projects';
import timeEntriesRoutes from './routes/timeEntries';
import servicesRoutes from './routes/services';
import invoicesRoutes from './routes/invoices';
import usersRoutes from './routes/users';
import dashboardRouter from './routes/dashboard';
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
// point at the real folder regardless of build output location:
const uploadsDir = path.resolve(__dirname, '../uploads');
console.log('→ serving static files from', uploadsDir);
app.use('/uploads', express.static(uploadsDir));
// Serve `/uploads` from the project root's uploads folder:
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);
// middleware
app.use(cors());
app.use(express.json());

// health check
app.get('/', (_req: Request, res: Response) => {
  res.send('DevGate API is running 🚀');
});

// routes
app.use('/auth', authRoutes);
app.use('/clients', clientsRoutes);
app.use('/projects', projectsRoutes);
app.use('/time-entries', timeEntriesRoutes);
app.use('/services', servicesRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/users', usersRoutes);
app.use('/dashboard', dashboardRouter);

// global error handler (optional)
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
