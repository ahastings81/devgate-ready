import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRouter from './routes/auth';
import clientsRouter from './routes/clients';
import projectsRouter from './routes/projects';
import timeEntriesRouter from './routes/timeEntries';
import invoicesRouter from './routes/invoices';
import servicesRouter from './routes/services'; 
import dashboardRouter from './routes/dashboard';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// public/auth
app.use('/auth', authRouter);

// protected routes
app.use('/clients', clientsRouter);
app.use('/projects', projectsRouter);
app.use('/time-entries', timeEntriesRouter);
app.use('/invoices', invoicesRouter);
app.use('/services', servicesRouter); 
app.use('/dashboard', dashboardRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
