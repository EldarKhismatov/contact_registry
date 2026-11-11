import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { ApiError } from './api-error.js';

/** Обработчик запросов, для которых не нашлось маршрута. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Маршрут ${req.method} ${req.originalUrl} не найден`,
  });
};

/** Единая точка обработки ошибок: клиент всегда получает одинаковый формат ответа. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({ message: error.message, fields: error.fields });
    return;
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : 'form';
      if (!fields[field]) {
        fields[field] = issue.message;
      }
    }

    res.status(400).json({ message: 'Проверьте правильность заполнения полей', fields });
    return;
  }

  // Некорректный JSON в теле запроса.
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ message: 'Некорректный JSON в теле запроса' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};
