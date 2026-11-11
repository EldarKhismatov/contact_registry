/**
 * Типы предметной области, которыми пользуются и клиент, и сервер.
 * Единственный источник правды — расхождение типов на клиенте и на сервере
 * сразу приводит к ошибкам компиляции.
 */

export type ContactStatusId = string;

export interface ContactStatus {
  id: ContactStatusId;
  label: string;
}

export interface Contact {
  id: string;
  /** ФИО. */
  name: string;
  /** Компания. */
  company: string;
  /** Email. Необязательное поле: пустая строка означает «email не указан». */
  email: string;
  statusId: ContactStatusId;
  /** Дата создания в формате ISO 8601. */
  createdAt: string;
  /** Дата последнего изменения в формате ISO 8601. */
  updatedAt: string;
}

/** Поля, по которым разрешена сортировка списка контактов. */
export const SORT_FIELDS = ['name', 'company', 'status', 'createdAt'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface ContactListQuery {
  /** Поиск по тексту: ФИО, компания, email, название статуса. */
  search?: string;
  sortBy?: SortField;
  sortDir?: SortDirection;
}

/** Данные, которые приходят от пользователя при создании/редактировании. */
export interface ContactInput {
  name: string;
  company: string;
  email: string;
  statusId: ContactStatusId;
}

/** Тело ответа с ошибкой API. */
export interface ApiErrorBody {
  message: string;
  /** Ошибки по полям формы: ключ — имя поля, значение — сообщение. */
  fields?: Record<string, string>;
}
