import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Contact, ContactInput, SortDirection, SortField } from '@shared/types';

import { http } from './http';
import { contactKeys } from './queryKeys';

/** Параметры списка контактов: они же входят в ключ кеша. */
export interface ContactListParams {
  search: string;
  /** Фильтр по статусу. Пустая строка — без фильтра. */
  status: string;
  sortBy: SortField;
  sortDir: SortDirection;
}

function buildListQuery({ search, status, sortBy, sortDir }: ContactListParams): string {
  const params = new URLSearchParams();

  const trimmedSearch = search.trim();
  if (trimmedSearch.length > 0) {
    params.set('search', trimmedSearch);
  }

  const trimmedStatus = status.trim();
  if (trimmedStatus.length > 0) {
    params.set('status', trimmedStatus);
  }

  params.set('sortBy', sortBy);
  params.set('sortDir', sortDir);

  return `?${params.toString()}`;
}

/** Список контактов. Поиск и сортировка выполняются на сервере. */
export function useContactsQuery(params: ContactListParams) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => http.get<Contact[]>(`/contacts${buildListQuery(params)}`),
    // При смене поиска показываем предыдущие данные, пока приходит новый ответ.
    placeholderData: keepPreviousData,
  });
}

/** Карточка контакта. */
export function useContactQuery(id: string | null) {
  return useQuery({
    queryKey: contactKeys.detail(id ?? ''),
    queryFn: () => http.get<Contact>(`/contacts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContactInput) => http.post<Contact>('/contacts', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContactInput }) =>
      http.put<Contact>(`/contacts/${id}`, input),
    onSuccess: (contact) => {
      queryClient.setQueryData(contactKeys.detail(contact.id), contact);
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete<void>(`/contacts/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: contactKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
  });
}
