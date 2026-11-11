import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { InMemoryContactsRepository } from '../src/repositories/in-memory.contacts.repository.js';
import { createSeedContacts } from '../src/seed/seed-contacts.js';

function createTestApp() {
  const repository = new InMemoryContactsRepository(createSeedContacts());

  return createApp({ repository });
}

const validPayload = {
  name: 'Пётр Иванов',
  company: 'ООО «Тест»',
  email: 'petr@example.ru',
  statusId: 'new',
};

describe('GET /api/contacts', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it('возвращает список контактов с сервера', async () => {
    const response = await request(app).get('/api/contacts').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('createdAt');
  });

  it('фильтрует список по поисковому запросу', async () => {
    const response = await request(app)
      .get('/api/contacts')
      .query({ search: 'Северный Ветер' })
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    for (const contact of response.body) {
      expect(contact.company).toContain('Северный Ветер');
    }
  });

  it('сортирует список по запрошенному полю', async () => {
    const response = await request(app)
      .get('/api/contacts')
      .query({ sortBy: 'name', sortDir: 'asc' })
      .expect(200);

    const names = response.body.map((contact: { name: string }) => contact.name);
    const sorted = [...names].sort((left, right) => left.localeCompare(right, 'ru'));

    expect(names).toEqual(sorted);
  });

  it('игнорирует некорректные параметры сортировки', async () => {
    const response = await request(app)
      .get('/api/contacts')
      .query({ sortBy: 'DROP TABLE', sortDir: 'asc' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /api/contacts', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it('создаёт контакт', async () => {
    const response = await request(app).post('/api/contacts').send(validPayload).expect(201);

    expect(response.body.name).toBe('Пётр Иванов');
    expect(response.body.id).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();

    const list = await request(app).get('/api/contacts').expect(200);
    expect(list.body.some((contact: { id: string }) => contact.id === response.body.id)).toBe(true);
  });

  it('принимает пустой email — поле необязательное', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({ ...validPayload, email: '' })
      .expect(201);

    expect(response.body.email).toBe('');
  });

  it('отклоняет некорректный email', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({ ...validPayload, email: 'не-почта' })
      .expect(400);

    expect(response.body.fields.email).toBeTruthy();
  });

  it('требует ФИО и компанию', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({ ...validPayload, name: '  ', company: '' })
      .expect(400);

    expect(response.body.fields.name).toBeTruthy();
    expect(response.body.fields.company).toBeTruthy();
  });

  it('отклоняет статус, которого нет в справочнике', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({ ...validPayload, statusId: 'unknown-status' })
      .expect(400);

    expect(response.body.fields.statusId).toBeTruthy();
  });
});

describe('GET /api/contacts/:id', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it('возвращает конкретную запись', async () => {
    const list = await request(app).get('/api/contacts').expect(200);
    const id = list.body[0].id as string;

    const response = await request(app).get(`/api/contacts/${id}`).expect(200);

    expect(response.body.id).toBe(id);
  });

  it('отвечает 404 для несуществующей записи', async () => {
    const response = await request(app).get('/api/contacts/does-not-exist').expect(404);

    expect(response.body.message).toBeTruthy();
  });
});

describe('PUT и DELETE /api/contacts/:id', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  it('обновляет запись', async () => {
    const created = await request(app).post('/api/contacts').send(validPayload).expect(201);
    const id = created.body.id as string;

    const response = await request(app)
      .put(`/api/contacts/${id}`)
      .send({ ...validPayload, company: 'ООО «Новая компания»' })
      .expect(200);

    expect(response.body.company).toBe('ООО «Новая компания»');
    expect(response.body.updatedAt).toBeTruthy();
  });

  it('не обновляет несуществующую запись', async () => {
    await request(app)
      .put('/api/contacts/missing')
      .send(validPayload)
      .expect(404);
  });

  it('удаляет запись', async () => {
    const created = await request(app).post('/api/contacts').send(validPayload).expect(201);
    const id = created.body.id as string;

    await request(app).delete(`/api/contacts/${id}`).expect(204);
    await request(app).get(`/api/contacts/${id}`).expect(404);
  });

  it('отвечает 404 при удалении несуществующей записи', async () => {
    await request(app).delete('/api/contacts/missing').expect(404);
  });
});

describe('GET /api/statuses', () => {
  it('возвращает справочник статусов', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/statuses').expect(200);

    expect(response.body.length).toBe(10);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('label');
  });
});
