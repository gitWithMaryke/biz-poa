import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import productsRouter from './routes/products.js';
import salesRouter from './routes/sales.js';
import syncRouter from './routes/sync.js';
import smsRouter from './routes/sms.js';
import ussdRouter from './routes/ussd.js';
import mpesaRouter from './routes/mpesa.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(morgan('dev'));

  // USSD webhooks typically use application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Bizpoa POS Backend API',
      version: '1.0.0',
      timestamp: Date.now()
    });
  });

  // API Routes
  app.use('/api/products', productsRouter);
  app.use('/api/sales', salesRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/sms', smsRouter);
  app.use('/api/ussd', ussdRouter);
  app.use('/api/mpesa', mpesaRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/settings', settingsRouter);

  // Serve compiled client UI if available, or a landing JSON page
  const clientDist = path.resolve(process.cwd(), '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req: Request, res: Response, next: any) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'Bizpoa POS Backend API',
        status: 'online',
        frontendDevUrl: 'http://localhost:3000',
        endpoints: {
          health: '/api/health',
          products: '/api/products',
          sales: '/api/sales',
          ussd: '/api/ussd'
        }
      });
    });
  }

  return app;
}
