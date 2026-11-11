import { beforeEach, describe, expect, it } from 'vitest';

import {
  DRAFT_TTL_MS,
  clearDraft,
  getDraftKey,
  readDraft,
  writeDraft,
} from './draftStorage';

describe('getDraftKey', () => {
  it('разделяет черновик создания и черновики редактирования', () => {
    const createKey = getDraftKey('create');
    const editKey = getDraftKey('edit', 'contact-1');
    const anotherEditKey = getDraftKey('edit', 'contact-2');

    expect(createKey).not.toBe(editKey);
    expect(editKey).not.toBe(anotherEditKey);
  });
});

describe('работа с localStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('сохраняет и читает черновик', () => {
    const key = getDraftKey('create');

    writeDraft(key, { name: 'Черновик' });

    const draft = readDraft(key);
    expect(draft?.values).toEqual({ name: 'Черновик' });
  });

  it('очищает черновик', () => {
    const key = getDraftKey('create');

    writeDraft(key, { name: 'Черновик' });
    clearDraft(key);

    expect(readDraft(key)).toBeNull();
  });

  it('не читает черновик, сохранённый для другой записи', () => {
    writeDraft(getDraftKey('edit', 'contact-1'), { name: 'Черновик' });

    expect(readDraft(getDraftKey('edit', 'contact-2'))).toBeNull();
    expect(readDraft(getDraftKey('create'))).toBeNull();
  });

  it('игнорирует устаревший черновик', () => {
    const key = getDraftKey('create');
    window.localStorage.setItem(
      key,
      JSON.stringify({
        values: { name: 'Давно' },
        savedAt: new Date(Date.now() - DRAFT_TTL_MS - 1000).toISOString(),
      }),
    );

    expect(readDraft(key)).toBeNull();
  });

  it('не падает на повреждённых данных', () => {
    const key = getDraftKey('create');
    window.localStorage.setItem(key, 'не json');

    expect(readDraft(key)).toBeNull();
  });
});
