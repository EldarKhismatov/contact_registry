import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export interface ContactCardController {
  /** Идентификатор открытой карточки (из ?id=…) либо null. */
  contactId: string | null;
  open: (id: string) => void;
  close: () => void;
}

/**
 * Карточка контакта отражена в адресной строке (?id=…), поэтому:
 *  - открытие добавляет запись в историю браузера, а закрытие возвращает назад;
 *  - повторное открытие той же записи не создаёт лишних записей в истории.
 */
export function useContactCard(): ContactCardController {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const contactId = searchParams.get('id');
  const listLocationKeyRef = useRef<string | null>(null);

  // Запоминаем запись истории, на которой открыт список контактов.
  useEffect(() => {
    if (!contactId && location.key) {
      listLocationKeyRef.current = location.key;
    }
  }, [contactId, location.key]);

  const open = useCallback(
    (id: string) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set('id', id);
          return next;
        },
        // Если карточка уже открыта, новую запись в историю не добавляем:
        // повторное открытие той же записи и переключение на другую
        // обновляют текущую запись истории, а не плодят новые.
        { replace: searchParams.get('id') !== null },
      );
    },
    [searchParams, setSearchParams],
  );

  const close = useCallback(() => {
    const listKey = listLocationKeyRef.current;
    const wasOpenedFromList = listKey !== null && location.key !== listKey;

    if (wasOpenedFromList) {
      // Возвращаемся назад по истории: карточка закрывается и кнопкой «Назад».
      navigate(-1);
      return;
    }

    // Карточка открыта сразу (например, по прямой ссылке) — историю не трогаем.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('id');
        return next;
      },
      { replace: true },
    );
  }, [listLocationKeyRef, location.key, navigate, setSearchParams]);

  return { contactId, open, close };
}
