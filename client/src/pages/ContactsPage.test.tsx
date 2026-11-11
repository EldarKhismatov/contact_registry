import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact, ContactStatus } from '@shared/types';

import { ContactsPage } from './ContactsPage';

const statuses: ContactStatus[] = [
  { id: 'new', label: 'Новый' },
  { id: 'active', label: 'Активный' },
  { id: 'archived', label: 'В архиве' },
];

const contacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Анна Ковалёва',
    company: 'ООО «Северный Ветер»',
    email: 'anna@example.ru',
    statusId: 'active',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'contact-2',
    name: 'Дмитрий Орлов',
    company: 'АО «Технопарк»',
    email: '',
    statusId: 'new',
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
  },
];

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ContactsPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('страница реестра контактов', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/statuses')) {
        return jsonResponse(statuses);
      }

      if (url.includes('/api/contacts')) {
        return jsonResponse(contacts);
      }

      return jsonResponse([]);
    });

    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('загружает список контактов с сервера', async () => {
    renderPage();

    expect(await screen.findByText('Анна Ковалёва')).toBeInTheDocument();
    expect(screen.getByText('Дмитрий Орлов')).toBeInTheDocument();
  });

  it('фильтрует список по статусу: запрос уходит с параметром status', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Анна Ковалёва');

    await user.click(screen.getByRole('combobox', { name: 'Фильтр по статусу' }));
    await user.click(screen.getByRole('option', { name: 'Активный' }));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => String(call[0]));
      expect(urls.some((url) => url.includes('status=active'))).toBe(true);
    });
  });

  it('сбрасывает фильтры по кнопке «Сбросить фильтры»', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Анна Ковалёва');

    await user.click(screen.getByRole('combobox', { name: 'Фильтр по статусу' }));
    await user.click(screen.getByRole('option', { name: 'Активный' }));

    const reset = await screen.findByRole('button', { name: 'Сбросить фильтры' });
    await user.click(reset);

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => String(call[0]));
      expect(urls.some((url) => url.includes('status=active'))).toBe(true);
      expect(urls[urls.length - 1]).not.toContain('status=');
    });
  });
});
