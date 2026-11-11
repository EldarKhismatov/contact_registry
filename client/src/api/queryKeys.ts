import type { ContactListParams } from './contacts';

/**
 * Ключи кеша TanStack Query.
 * Список входит в ключ `all`, поэтому его можно сбросить целиком одной командой.
 */
export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: ContactListParams) => ['contacts', 'list', params] as const,
  detail: (id: string) => ['contacts', 'detail', id] as const,
};

export const statusKeys = {
  all: ['statuses'] as const,
};
