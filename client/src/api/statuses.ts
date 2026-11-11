import { useQuery } from '@tanstack/react-query';
import type { ContactStatus } from '@shared/types';

import { http } from './http';
import { statusKeys } from './queryKeys';

/** Справочник статусов приходит с сервера — так клиент не дублирует бизнес-правила. */
export function useStatusesQuery() {
  return useQuery({
    queryKey: statusKeys.all,
    queryFn: () => http.get<ContactStatus[]>('/statuses'),
    staleTime: 5 * 60 * 1000,
  });
}
