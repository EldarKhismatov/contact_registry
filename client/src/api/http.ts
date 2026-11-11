import type { ApiErrorBody } from '@shared/types';

/** Ошибка запроса к API с понятным клиенту сообщением. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new HttpError(0, 'Сервер недоступен. Проверьте, что API запущен.');
  }

  const payload = await readBody(response);

  if (!response.ok) {
    const body = payload as ApiErrorBody | null;

    throw new HttpError(
      response.status,
      body?.message ?? `Ошибка запроса (${response.status})`,
      body?.fields,
    );
  }

  return payload as T;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Тонкая обёртка над fetch: единое место, где живут базовый URL и обработка ошибок. */
export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
