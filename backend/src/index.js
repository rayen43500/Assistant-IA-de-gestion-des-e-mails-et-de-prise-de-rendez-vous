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
import { seedInitialData } from './config/seed.js';

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
app.use(cors({
  origin: '*', // Adaptable selon le frontend en production
  credentials: true,
}));
app.use(express.json());
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
app.use('/api/appointments', appointmentRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/ai', aiRoutes);

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

// Démarrage du serveur et connexion DB
const startServer = async () => {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Serveur Backend opérationnel sur le port ${PORT}`);
    console.log(`📊 Métriques Prometheus disponibles sur http://localhost:${PORT}/metrics`);
    console.log(`🩺 Health check sur http://localhost:${PORT}/health`);
    console.log(`===================================================`);
  });
};

startServer();
