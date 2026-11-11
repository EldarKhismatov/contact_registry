import { Router } from 'express';

import type { ContactsService } from '../services/contacts.service.js';
import { createContactsController } from '../controllers/contacts.controller.js';

export function createContactsRouter(service: ContactsService): Router {
  const router = Router();
  const controller = createContactsController(service);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
