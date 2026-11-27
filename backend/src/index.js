import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import client from 'prom-client';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/emails.js';
import appointmentRoutes from './routes/appointments.js';
import knowledgeRoutes from './routes/knowledge.js';
import clinicRoutes from './routes/clinics.js';
import aiRoutes from './routes/ai.js';
import integrationsRoutes from './routes/integrations.js';
import emailRoutingRoutes from './routes/emailRouting.js';
import publicBookingRoutes from './routes/publicBooking.js';
import contactsRoutes from './routes/contacts.js';
import scheduleRoutes from './routes/schedule.js';
import adminRoutes from './routes/admin.js';
import { seedInitialData } from './config/seed.js';
import { startGmailPolling } from './services/gmailPollingService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Prometheus Metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware DevSecOps & Sécurité
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Requêtes serveur à serveur (n8n, curl) : pas d'en-tête Origin
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rate Limiting (Protection contre attaques brute-force / DoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 150,
  message: { message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.' },
});
app.use('/api', limiter);

// Middleware de comptage Prometheus
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

// Routes API REST
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/emails', emailRoutingRoutes);
app.use('/api/webhooks', emailRoutingRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/public', publicBookingRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);

// Route racine d'accueil API
app.get('/', (req, res) => {
  res.json({
    name: 'MediLawAI SaaS Backend API',
    status: 'ONLINE',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      emails: '/api/emails',
      appointments: '/api/appointments',
      ai: '/api/ai',
      auth: '/api/auth'
    }
  });
});

// Endpoint Prometheus pour le scraping
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Backend Node.js/Express SaaS',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
  });
});

// Gestionnaire global d'erreurs
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Démarrage immédiat du serveur et connexion DB en arrière-plan
const startServer = async () => {
  // Démarrer immédiatement le serveur HTTP
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Serveur Backend opérationnel sur le port ${PORT}`);
    console.log(`📊 Métriques Prometheus disponibles sur http://localhost:${PORT}/metrics`);
    console.log(`🩺 Health check sur http://localhost:${PORT}/health`);
    console.log(`📧 Service Gmail centralisé activé`);
    console.log(`===================================================`);
    try {
      startGmailPolling();
    } catch (pollErr) {
      console.warn('[Gmail Polling] Démarrage différé:', pollErr.message);
    }
  });

  // Tenter la connexion DB sans bloquer le serveur
  connectDB().then(async () => {
    try {
      await seedInitialData();
    } catch (seedErr) {
      console.warn('[Seed] Différé :', seedErr.message);
    }
  }).catch(err => {
    console.warn('[Startup] Connexion DB différée :', err.message);
  });
};

startServer();
