import type { ContactStatus } from './types.js';

/**
 * Справочник статусов контакта.
 *
 * Статусов больше восьми — это осознанно: в требованиях сказано, что поиск
 * внутри выпадающей панели нужен только когда вариантов больше 8, поэтому
 * в справочнике должны быть представлены обе ветки поведения.
 */
export const CONTACT_STATUSES: readonly ContactStatus[] = [
  { id: 'new', label: 'Новый' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'approval', label: 'На согласовании' },
  { id: 'active', label: 'Активный' },
  { id: 'on_hold', label: 'Отложен' },
  { id: 'blocked', label: 'Заблокирован' },
  { id: 'rejected', label: 'Отказ' },
  { id: 'archived', label: 'В архиве' },
  { id: 'unknown', label: 'Статус неизвестен' },
  { id: 'deleted', label: 'Удалён' },
];

export const STATUS_IDS: string[] = CONTACT_STATUSES.map((status) => status.id);

export function getStatusLabel(statusId: string): string | undefined {
  return CONTACT_STATUSES.find((status) => status.id === statusId)?.label;
}

/** Порядок статуса в справочнике — по нему сортируется колонка «Статус». */
export function getStatusOrder(statusId: string): number {
  const index = STATUS_IDS.indexOf(statusId);
  return index === -1 ? STATUS_IDS.length : index;
}
