import type { Contact, ContactInput } from '../../../shared/src/index.js';

/**
 * Контракт хранилища контактов.
 *
 * Сервисный слой работает только с этим интерфейсом, поэтому реализацию
 * можно заменить на другую (в памяти, файл, SQLite), не трогая остальной код.
 */
export interface ContactRepository {
  list(): Promise<Contact[]>;
  findById(id: string): Promise<Contact | null>;
  create(input: ContactInput): Promise<Contact>;
  update(id: string, input: ContactInput): Promise<Contact | null>;
  remove(id: string): Promise<boolean>;
}
