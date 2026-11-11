import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Contact, ContactInput } from '../../../shared/src/index.js';

import type { ContactRepository } from './contacts.repository.js';

interface FileShape {
  contacts: Contact[];
}

/**
 * Хранилище в JSON-файле: данные переживают перезапуск сервера.
 * Файл читается при старте, при каждом изменении он переписывается.
 */
export class JsonFileContactsRepository implements ContactRepository {
  private contacts: Contact[] = [];
  private writeChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly seed: Contact[] = [],
  ) {}

  /** Создаёт репозиторий и читает файл (или создаёт его из seed-данных). */
  static async create(filePath: string, seed: Contact[] = []): Promise<JsonFileContactsRepository> {
    const repository = new JsonFileContactsRepository(filePath, seed);
    await repository.load();

    return repository;
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
    await this.persist();

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
    await this.persist();

    return { ...updated };
  }

  async remove(id: string): Promise<boolean> {
    const index = this.contacts.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }

    this.contacts.splice(index, 1);
    await this.persist();

    return true;
  }

  private async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as FileShape | Contact[];

      if (Array.isArray(parsed)) {
        this.contacts = parsed;
        return;
      }

      if (Array.isArray(parsed?.contacts)) {
        this.contacts = parsed.contacts;
        return;
      }

      throw new Error('Файл данных имеет неожиданный формат');
    } catch (error) {
      if (!isNotFoundError(error)) {
        // Файл повреждён — не молча теряем данные, а сообщаем об ошибке.
        throw error;
      }

      this.contacts = this.seed.map((contact) => ({ ...contact }));
      await this.persist();
    }
  }

  /** Записи ставятся в очередь, чтобы параллельные изменения не перетирали друг друга. */
  private async persist(): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      const payload: FileShape = { contacts: this.contacts };

      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    });

    await this.writeChain;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}
