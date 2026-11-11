import { describe, expect, it } from 'vitest';

import { createSeedContacts } from '../src/seed/seed-contacts.js';
import { ContactsService, filterBySearch, sortContacts } from '../src/services/contacts.service.js';
import { InMemoryContactsRepository } from '../src/repositories/in-memory.contacts.repository.js';

const contacts = createSeedContacts();

describe('filterBySearch', () => {
  it('ищет по ФИО без учёта регистра', () => {
    const result = filterBySearch(contacts, 'анна');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Анна Ковалёва');
  });

  it('ищет по компании', () => {
    const result = filterBySearch(contacts, 'Технопарк');

    expect(result.length).toBeGreaterThan(1);
  });

  it('ищет по названию статуса', () => {
    const result = filterBySearch(contacts, 'Отказ');

    expect(result.every((contact) => contact.statusId === 'rejected')).toBe(true);
  });

  it('пустой запрос возвращает все записи', () => {
    expect(filterBySearch(contacts, '   ')).toHaveLength(contacts.length);
  });
});

describe('sortContacts', () => {
  it('сортирует по ФИО в обе стороны', () => {
    const ascending = sortContacts(contacts, 'name', 'asc').map((contact) => contact.name);
    const descending = sortContacts(contacts, 'name', 'desc').map((contact) => contact.name);

    expect(descending).toEqual([...ascending].reverse());
  });

  it('сортирует по дате создания', () => {
    const sorted = sortContacts(contacts, 'createdAt', 'asc');

    for (let index = 1; index < sorted.length; index += 1) {
      expect(Date.parse(sorted[index].createdAt)).toBeGreaterThanOrEqual(
        Date.parse(sorted[index - 1].createdAt),
      );
    }
  });

  it('не меняет исходный массив', () => {
    const original = [...contacts];

    sortContacts(contacts, 'company', 'asc');

    expect(contacts).toEqual(original);
  });
});

describe('ContactsService', () => {
  it('создаёт запись и находит её по идентификатору', async () => {
    const service = new ContactsService(new InMemoryContactsRepository());

    const created = await service.create({
      name: 'Тест Тестов',
      company: 'ООО «Тест»',
      email: '',
      statusId: 'new',
    });

    const found = await service.get(created.id);

    expect(found.id).toBe(created.id);
  });

  it('выбрасывает понятную ошибку для несуществующей записи', async () => {
    const service = new ContactsService(new InMemoryContactsRepository());

    await expect(service.get('missing')).rejects.toThrow('Контакт не найден');
  });
});
