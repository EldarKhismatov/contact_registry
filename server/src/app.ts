import express, { type Express, type RequestHandler } from 'express';

import { errorHandler, notFoundHandler } from './http/error-handler.js';
import type { ContactRepository } from './repositories/contacts.repository.js';
import { createContactsRouter } from './routes/contacts.routes.js';
import { createStatusesRouter } from './routes/statuses.routes.js';
import { ContactsService } from './services/contacts.service.js';

interface CreateAppOptions {
  repository: ContactRepository;
  allowedOrigins?: string[];
}

/**
 * Собирает Express-приложение.
 * Хранилище передаётся снаружи — так приложение можно поднять с любым репозиторием (в тестах — в памяти).
 */
export function createApp({ repository, allowedOrigins = [] }: CreateAppOptions): Express {
  const app = express();

  app.use(express.json());
  app.use(corsMiddleware(allowedOrigins));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/statuses', createStatusesRouter());
  app.use('/api/contacts', createContactsRouter(new ContactsService(repository)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/** Минимальный CORS: в dev фронт идёт через прокси Vite, но бывает полезно обращаться к API напрямую. */
function corsMiddleware(allowedOrigins: string[]): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}
