import { useCallback, useEffect, useRef, useState } from 'react';
import { useWatch, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';

import {
  clearDraft,
  getDraftKey,
  readDraft,
  writeDraft,
  type DraftMode,
  type DraftValues,
} from './draftStorage';

interface UseFormDraftOptions<T extends FieldValues> {
  mode: DraftMode;
  /** Идентификатор записи в режиме редактирования. */
  contactId?: string;
  form: UseFormReturn<T>;
  /** Значения, с которых начинается форма (для редактирования — данные с сервера). */
  defaultValues: T;
  /** Задержка автосохранения: значения пишутся в localStorage «по мере ввода». */
  saveDelayMs?: number;
}

/**
 * Автосохранение черновика формы в localStorage и его восстановление.
 *
 * В черновик попадают только изменённые поля: иначе при восстановлении
 * редактирования затерелись бы значения, пришедшие с сервера.
 */
export function useFormDraft<T extends FieldValues>({
  mode,
  contactId,
  form,
  defaultValues,
  saveDelayMs = 400,
}: UseFormDraftOptions<T>) {
  const draftKey = getDraftKey(mode, contactId);
  const [isRestored, setIsRestored] = useState(false);
  const isRestoredRef = useRef(false);

  // Значения полей: подписка нужна, чтобы автосохранение срабатывало
  // на каждое изменение, а не только на смену «грязности» поля.
  const watchedValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  // Восстановление сохранённых данных при открытии формы.
  useEffect(() => {
    if (isRestoredRef.current) {
      return;
    }
    isRestoredRef.current = true;

    const draft = readDraft(draftKey);
    if (!draft) {
      return;
    }

    form.reset({ ...defaultValues, ...draft.values } as T);
    setIsRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Сохранение изменённых полей по мере ввода.
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      const patch = collectDirtyValues(form);

      if (Object.keys(patch).length > 0) {
        writeDraft(draftKey, patch as DraftValues);
      } else {
        clearDraft(draftKey);
      }
    }, saveDelayMs);

    return () => window.clearTimeout(timer);
  }, [watchedValues, isDirty, draftKey, form, saveDelayMs]);

  /** Очистка черновика: удаляем его из хранилища и сбрасываем форму. */
  const discardDraft = useCallback(() => {
    clearDraft(draftKey);
    form.reset(defaultValues);
    setIsRestored(false);
  }, [draftKey, form, defaultValues]);

  return { draftKey, isRestored, discardDraft };
}

/** Собирает только те поля, которые пользователь изменил. */
function collectDirtyValues<T extends FieldValues>(form: UseFormReturn<T>): Record<string, unknown> {
  const values = form.getValues() as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  for (const key of Object.keys(values)) {
    const fieldState = form.getFieldState(key as FieldPath<T>);

    if (fieldState.isDirty) {
      patch[key] = values[key];
    }
  }

  return patch;
}
