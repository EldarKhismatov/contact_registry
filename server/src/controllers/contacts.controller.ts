import type { RequestHandler } from 'express';

import { contactIdParamSchema, contactListQuerySchema } from '../../../shared/src/index.js';

import type { ContactsService } from '../services/contacts.service.js';

/** HTTP-слой: разбирает запрос, передаёт работу сервису и отдаёт ответ. */
export function createContactsController(service: ContactsService) {
  const list: RequestHandler = async (req, res) => {
    const query = contactListQuerySchema.parse(req.query);
    const contacts = await service.list(query);

    res.json(contacts);
  };

  const getById: RequestHandler = async (req, res) => {
    const { id } = contactIdParamSchema.parse(req.params);
    const contact = await service.get(id);

    res.json(contact);
  };

  const create: RequestHandler = async (req, res) => {
    const contact = await service.create(req.body);

    res.status(201).json(contact);
  };

  const update: RequestHandler = async (req, res) => {
    const { id } = contactIdParamSchema.parse(req.params);
    const contact = await service.update(id, req.body);

    res.json(contact);
  };

  const remove: RequestHandler = async (req, res) => {
    const { id } = contactIdParamSchema.parse(req.params);
    await service.remove(id);

    res.status(204).end();
  };

  return { list, getById, create, update, remove };
}
