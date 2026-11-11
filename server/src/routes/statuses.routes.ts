import { Router } from 'express';

import { CONTACT_STATUSES } from '../../../shared/src/index.js';

export function createStatusesRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(CONTACT_STATUSES);
  });

  return router;
}
