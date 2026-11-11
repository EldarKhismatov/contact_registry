import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Contact } from '@shared/types';

import { ContactsTable } from './ContactsTable';

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

const statusLabels = { active: 'Активный', new: 'Новый' };

describe('ContactsTable', () => {
  it('выводит контакты и их статусы', () => {
    render(
      <ContactsTable
        contacts={contacts}
        sortBy="createdAt"
        sortDir="desc"
        statusLabels={statusLabels}
        onSortChange={() => {}}
        onOpen={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText('Анна Ковалёва')).toBeInTheDocument();
    expect(screen.getByText('ООО «Северный Ветер»')).toBeInTheDocument();
    expect(screen.getByText('Активный')).toBeInTheDocument();
  });

  it('сообщает о сортировке по клику на заголовок столбца', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <ContactsTable
        contacts={contacts}
        sortBy="createdAt"
        sortDir="desc"
        statusLabels={statusLabels}
        onSortChange={onSortChange}
        onOpen={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /ФИО/ }));

    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('открывает карточку по клику на строку', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <ContactsTable
        contacts={contacts}
        sortBy="createdAt"
        sortDir="desc"
        statusLabels={statusLabels}
        onSortChange={() => {}}
        onOpen={onOpen}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    await user.click(screen.getByText('Дмитрий Орлов'));

    expect(onOpen).toHaveBeenCalledWith(contacts[1]);
  });

  it('помечает отсортированный столбец для скринридеров', () => {
    render(
      <ContactsTable
        contacts={contacts}
        sortBy="name"
        sortDir="asc"
        statusLabels={statusLabels}
        onSortChange={() => {}}
        onOpen={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /ФИО/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: /Компания/ })).toHaveAttribute('aria-sort', 'none');
  });
});
