import express from 'express';
import cors from 'cors';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import clientUserRoutes from './routes/clientUsers.js';
import taskRoutes from './routes/tasks.js';
import timeEntryRoutes from './routes/timeEntries.js';
import dashboardRoutes from './routes/dashboard.js';
import ticketRoutes from './routes/tickets.js';
import sectorRoutes from './routes/sectors.js';

const __dirname = path.dirname(require.resolve('./index.js'));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-users', clientUserRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/sectors', sectorRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use((_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
