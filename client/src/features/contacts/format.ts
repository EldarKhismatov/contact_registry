const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Дата создания в виде «12.05.2026». */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}
