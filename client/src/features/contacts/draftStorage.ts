import type { ContactFormValues } from '@shared/schemas';

export type DraftValues = Partial<ContactFormValues>;

export interface StoredDraft {
  values: DraftValues;
  savedAt: string;
}

export type DraftMode = 'create' | 'edit';

const STORAGE_PREFIX = 'contacts:draft:';

/** Черновик считается устаревшим через неделю. */
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Ключ черновика в localStorage.
 *
 * Черновик создания и черновик редактирования конкретной записи не должны
 * путаться друг с другом, поэтому режим и идентификатор записи входят в ключ.
 */
export function getDraftKey(mode: DraftMode, contactId?: string): string {
  return mode === 'create'
    ? `${STORAGE_PREFIX}create`
    : `${STORAGE_PREFIX}edit:${contactId ?? 'unknown'}`;
}

export function readDraft(key: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.values) {
      return null;
    }

    const savedAt = Date.parse(parsed.savedAt);
    if (Number.isNaN(savedAt) || Date.now() - savedAt > DRAFT_TTL_MS) {
      clearDraft(key);
      return null;
    }

    return parsed;
  } catch {
    // Повреждённый JSON или недоступное хранилище — просто начинаем с чистой формы.
    return null;
  }
}

export function writeDraft(key: string, values: DraftValues): void {
  try {
    const payload: StoredDraft = { values, savedAt: new Date().toISOString() };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Переполненное или запрещённое хранилище не должно ломать работу формы.
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Игнорируем: черновик не смогли удалить — форма всё равно будет очищена.
  }
}
