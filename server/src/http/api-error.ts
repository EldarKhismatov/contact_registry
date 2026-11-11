/** Ошибка, которую можно безопасно показать клиенту. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, fields?: Record<string, string>): ApiError {
    return new ApiError(400, message, fields);
  }

  static notFound(message = 'Запись не найдена'): ApiError {
    return new ApiError(404, message);
  }
}
