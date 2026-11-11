import { randomUUID } from 'node:crypto';

import type { Contact, ContactInput } from '../../../shared/src/index.js';

import type { ContactRepository } from './contacts.repository.js';

/** Хранилище в памяти процесса: данные исчезают при перезапуске сервера. */
export class InMemoryContactsRepository implements ContactRepository {
  private contacts: Contact[];

  constructor(seed: Contact[] = []) {
    this.contacts = seed.map((contact) => ({ ...contact }));
  }

  async list(): Promise<Contact[]> {
    return this.contacts.map((contact) => ({ ...contact }));
  }

  async findById(id: string): Promise<Contact | null> {
    const contact = this.contacts.find((item) => item.id === id);
    return contact ? { ...contact } : null;
  }

  async create(input: ContactInput): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };

    this.contacts.push(contact);

    return { ...contact };
  }

  async update(id: string, input: ContactInput): Promise<Contact | null> {
    const index = this.contacts.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated: Contact = {
      ...this.contacts[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.contacts[index] = updated;

    return { ...updated };
  }

  async remove(id: string): Promise<boolean> {
    const index = this.contacts.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }

    this.contacts.splice(index, 1);

    return true;
  }
}
