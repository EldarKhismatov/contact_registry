import {
  collectFieldErrors,
  contactFormSchema,
  getStatusLabel,
  getStatusOrder,
  type Contact,
  type ContactInput,
  type ContactListQuery,
  type SortDirection,
  type SortField,
} from '../../../shared/src/index.js';

import { ApiError } from '../http/api-error.js';
import type { ContactRepository } from '../repositories/contacts.repository.js';

/**
 * Бизнес-логика реестра контактов: поиск, сортировка и правила работы с записями.
 * Не знает про HTTP — только про данные.
 */
export class ContactsService {
  constructor(private readonly repository: ContactRepository) {}

  async list(query: ContactListQuery = {}): Promise<Contact[]> {
    const contacts = await this.repository.list();
    const filtered = filterBySearch(contacts, query.search ?? '');
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    return sortContacts(filtered, sortBy, sortDir);
  }

  async get(id: string): Promise<Contact> {
    const contact = await this.repository.findById(id);
    if (!contact) {
      throw ApiError.notFound('Контакт не найден');
    }

    return contact;
  }

  async create(input: unknown): Promise<Contact> {
    const contactInput = parseContactInput(input);

    return this.repository.create(contactInput);
  }

  async update(id: string, input: unknown): Promise<Contact> {
    const contactInput = parseContactInput(input);

    const updated = await this.repository.update(id, contactInput);
    if (!updated) {
      throw ApiError.notFound('Контакт не найден');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.repository.remove(id);
    if (!removed) {
      throw ApiError.notFound('Контакт не найден');
    }
  }
}

/** Валидирует входные данные тем же набором правил, что и форма на клиенте. */
function parseContactInput(input: unknown): ContactInput {
  const result = contactFormSchema.safeParse(input);

  if (!result.success) {
    throw ApiError.badRequest(
      'Проверьте правильность заполнения полей',
      collectFieldErrors(result.error),
    );
  }

  return {
    name: result.data.name,
    company: result.data.company,
    email: result.data.email,
    statusId: result.data.statusId,
  };
}

/** Поиск по тексту: ФИО, компания, email и название статуса. */
export function filterBySearch(contacts: Contact[], search: string): Contact[] {
  const query = search.trim().toLowerCase();
  if (query.length === 0) {
    return contacts;
  }

  return contacts.filter((contact) => {
    const statusLabel = getStatusLabel(contact.statusId) ?? '';

    return [contact.name, contact.company, contact.email, statusLabel].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
}

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });

export function sortContacts(
  contacts: Contact[],
  sortBy: SortField,
  sortDir: SortDirection,
): Contact[] {
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...contacts].sort((left, right) => {
    const comparison = compareByField(left, right, sortBy);

    return comparison * direction;
  });
}

function compareByField(left: Contact, right: Contact, sortBy: SortField): number {
  switch (sortBy) {
    case 'name':
      return collator.compare(left.name, right.name);
    case 'company':
      return collator.compare(left.company, right.company);
    case 'status':
      return getStatusOrder(left.statusId) - getStatusOrder(right.statusId);
    case 'createdAt':
      return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  }
}
