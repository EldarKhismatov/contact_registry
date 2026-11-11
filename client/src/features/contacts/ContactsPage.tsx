import { useMemo, useState } from 'react';
import type { Contact, SortDirection, SortField } from '@shared/types';

import { useCreateContactMutation, useContactsQuery, useDeleteContactMutation } from '@/api/contacts';
import { useStatusesQuery } from '@/api/statuses';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

import { ContactCard } from './ContactCard';
import { ContactForm } from './ContactForm';
import { ContactsTable } from './ContactsTable';
import { useContactCard } from './useContactCard';
import { useDebouncedValue } from './useDebouncedValue';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export function ContactsPage() {
  const { contactId, open: openCard, close: closeCard } = useContactCard();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  /** Запись, карточка которой открыта в режиме редактирования. */
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const statusesQuery = useStatusesQuery();
  const contactsQuery = useContactsQuery({
    search: debouncedSearch,
    sortBy: sort.field,
    sortDir: sort.direction,
  });
  const createMutation = useCreateContactMutation();
  const deleteMutation = useDeleteContactMutation();

  const statuses = useMemo(() => statusesQuery.data ?? [], [statusesQuery.data]);
  const statusLabels = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status.id, status.label])),
    [statuses],
  );
  const contacts = contactsQuery.data ?? [];

  const handleSortChange = (field: SortField) => {
    setSort((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
  };

  const handleOpenCreate = () => {
    createMutation.reset();
    setIsCreateModalOpen(true);
  };

  const handleCloseCard = () => {
    setEditingContactId(null);
    closeCard();
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    openCard(contact.id);
  };

  const handleDelete = async (contact: Contact) => {
    const confirmed = window.confirm(
      `Удалить контакт «${contact.name}»? Действие нельзя отменить.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync(contact.id);

    // Если была открыта именно эта запись — карточку закрываем.
    if (contactId === contact.id) {
      setEditingContactId(null);
      closeCard();
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Реестр контактов</h1>
          <p className="page__subtitle">
            Список контактов, поиск, фильтр и карточки. Данные хранятся на сервере.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          Добавить контакт
        </Button>
      </header>

      <div className="page__toolbar">
        <label className="search">
          <span className="search__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="search__input"
            type="search"
            value={search}
            placeholder="Поиск по ФИО, компании, email или статусу"
            aria-label="Поиск по контактам"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {contactsQuery.isFetching && !contactsQuery.isLoading ? (
          <span className="page__hint">Обновляем список…</span>
        ) : null}
      </div>

      {statusesQuery.isError ? (
        <Banner tone="error" title="Не удалось загрузить справочник статусов">
          {(statusesQuery.error as Error).message}
        </Banner>
      ) : null}

      {contactsQuery.isError ? (
        <Banner tone="error" title="Не удалось загрузить список контактов">
          {(contactsQuery.error as Error).message}
        </Banner>
      ) : null}

      <div className={contactId ? 'layout layout--card' : 'layout'}>
        <section className="layout__main">
          {contactsQuery.isLoading ? <Spinner label="Загружаем контакты" /> : null}

          {!contactsQuery.isLoading && contacts.length === 0 ? (
            <EmptyState
              title="Контакты не найдены"
              description={
                search
                  ? 'Измените поисковый запрос или очистите его, чтобы увидеть все записи.'
                  : 'Добавьте первый контакт, чтобы он появился в реестре.'
              }
              action={
                <Button variant="primary" onClick={handleOpenCreate}>
                  Добавить контакт
                </Button>
              }
            />
          ) : null}

          {contacts.length > 0 ? (
            <ContactsTable
              contacts={contacts}
              sortBy={sort.field}
              sortDir={sort.direction}
              statusLabels={statusLabels}
              onSortChange={handleSortChange}
              onOpen={(contact) => openCard(contact.id)}
              onEdit={handleEditContact}
              onDelete={handleDelete}
            />
          ) : null}
        </section>

        {contactId ? (
          <ContactCard
            contactId={contactId}
            statuses={statuses}
            isEditing={editingContactId === contactId}
            onStartEdit={() => setEditingContactId(contactId)}
            onCancelEdit={() => setEditingContactId(null)}
            onClose={handleCloseCard}
            onDelete={handleDelete}
          />
        ) : null}
      </div>

      <Modal isOpen={isCreateModalOpen} title="Новый контакт" onClose={() => setIsCreateModalOpen(false)}>
        <ContactForm
          mode="create"
          statuses={statuses}
          submitLabel="Создать контакт"
          serverError={createMutation.isError ? (createMutation.error as Error).message : null}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values);
            setIsCreateModalOpen(false);
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
