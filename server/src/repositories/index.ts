import type { Contact } from '../../../shared/src/index.js';

import type { ContactRepository } from './contacts.repository.js';
import { InMemoryContactsRepository } from './in-memory.contacts.repository.js';
import { JsonFileContactsRepository } from './json-file.contacts.repository.js';

export type { ContactRepository } from './contacts.repository.js';
export { InMemoryContactsRepository } from './in-memory.contacts.repository.js';
export { JsonFileContactsRepository } from './json-file.contacts.repository.js';

interface RepositoryFactoryOptions {
  storage: 'json' | 'memory';
  dataFile: string;
  seed: Contact[];
}

export async function createContactsRepository({
  storage,
  dataFile,
  seed,
}: RepositoryFactoryOptions): Promise<ContactRepository> {
  if (storage === 'memory') {
    return new InMemoryContactsRepository(seed);
  }

  return JsonFileContactsRepository.create(dataFile, seed);
}
