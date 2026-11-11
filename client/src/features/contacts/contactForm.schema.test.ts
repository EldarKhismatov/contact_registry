import { describe, expect, it } from 'vitest';

import { contactFormSchema } from '@shared/schemas';

const validValues = {
  name: 'Иван Иванов',
  company: 'ООО «Компания»',
  email: 'ivan@example.ru',
  statusId: 'new',
};

describe('contactFormSchema', () => {
  it('принимает корректные данные', () => {
    const result = contactFormSchema.safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it('требует ФИО', () => {
    const result = contactFormSchema.safeParse({ ...validValues, name: '   ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['name']);
  });

  it('требует компанию', () => {
    const result = contactFormSchema.safeParse({ ...validValues, company: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['company']);
  });

  it('разрешает пустой email — поле необязательное', () => {
    const result = contactFormSchema.safeParse({ ...validValues, email: '' });

    expect(result.success).toBe(true);
  });

  it('отклоняет некорректный email', () => {
    const result = contactFormSchema.safeParse({ ...validValues, email: 'ivan@@example' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['email']);
  });

  it('отклоняет статус, которого нет в справочнике', () => {
    const result = contactFormSchema.safeParse({ ...validValues, statusId: 'made-up' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['statusId']);
  });

  it('обрезает пробелы вокруг значений', () => {
    const result = contactFormSchema.safeParse({ ...validValues, name: '  Иван Иванов  ' });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Иван Иванов');
  });
});
