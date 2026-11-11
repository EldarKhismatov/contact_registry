import { z } from 'zod';

import { STATUS_IDS } from './statuses.js';
import { SORT_DIRECTIONS, SORT_FIELDS } from './types.js';

const MAX_TEXT_LENGTH = 120;

/**
 * Email необязателен, но если поле заполнено — значение должно быть
 * похоже на настоящий адрес. Пустая строка (поле не заполнено) — валидна.
 */
export const optionalEmailSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value.length === 0) return;

    const parsed = z.email().safeParse(value);
    if (!parsed.success) {
      ctx.addIssue({ code: 'custom', message: 'Укажите корректный email' });
    }
  });

/** Схема формы создания/редактирования контакта. Используется и на клиенте, и на сервере. */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Укажите ФИО').max(MAX_TEXT_LENGTH, 'Не более 120 символов'),
  company: z.string().trim().min(1, 'Укажите компанию').max(MAX_TEXT_LENGTH, 'Не более 120 символов'),
  email: optionalEmailSchema,
  statusId: z
    .string()
    .trim()
    .min(1, 'Выберите статус')
    .refine((value) => STATUS_IDS.includes(value), 'Неизвестный статус'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** Параметры запроса списка контактов. */
export const contactListQuerySchema = z.object({
  search: z.string().trim().max(200, 'Слишком длинный поисковый запрос').catch(''),
  /** Фильтр по статусу. Пустая строка — без фильтра. */
  status: z.string().trim().max(60, 'Слишком длинный идентификатор статуса').catch(''),
  sortBy: z.enum(SORT_FIELDS).catch('createdAt'),
  sortDir: z.enum(SORT_DIRECTIONS).catch('desc'),
});

export type ContactListQueryValues = z.infer<typeof contactListQuerySchema>;

/** Параметр :id в маршрутах /api/contacts/:id. */
export const contactIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Не указан идентификатор'),
});

/** Превращает ошибки zod в карту «поле → сообщение» для ответа API. */
export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'form';
    if (!fields[field]) {
      fields[field] = issue.message;
    }
  }

  return fields;
}
