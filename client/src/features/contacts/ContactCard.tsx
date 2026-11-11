import { useEffect } from 'react';
import type { Contact, ContactStatus } from '@shared/types';

import { useContactQuery, useUpdateContactMutation } from '@/api/contacts';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

import { ContactForm } from './ContactForm';
import { formatDate } from './format';

interface ContactCardProps {
  contactId: string;
  statuses: ContactStatus[];
  /** Открыта ли карточка в режиме редактирования. */
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onDelete: (contact: Contact) => void;
}

/** Карточка контакта: подробности и форма редактирования. */
export function ContactCard({
  contactId,
  statuses,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onClose,
  onDelete,
}: ContactCardProps) {
  const contactQuery = useContactQuery(contactId);
  const updateMutation = useUpdateContactMutation();

  // При переходе к другой записи ошибки прошлого сохранения не актуальны.
  useEffect(() => {
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const contact = contactQuery.data;
  const statusLabel = contact
    ? (statuses.find((status) => status.id === contact.statusId)?.label ?? contact.statusId)
    : '';

  return (
    <aside className="card" aria-label="Карточка контакта">
      <header className="card__header">
        <div>
          <p className="card__eyebrow">Карточка контакта</p>
          <h2 className="card__title">{contact ? contact.name : 'Контакт'}</h2>
        </div>
        <button type="button" className="card__close" onClick={onClose} aria-label="Закрыть карточку">
          ×
        </button>
      </header>

      {contactQuery.isLoading ? <Spinner label="Загружаем карточку" /> : null}

      {contactQuery.isError ? (
        <Banner tone="error" title="Не удалось загрузить карточку">
          {(contactQuery.error as Error).message}
        </Banner>
      ) : null}

      {contact && !isEditing ? (
        <>
          <dl className="card__details">
            <div className="card__detail">
              <dt>Компания</dt>
              <dd>{contact.company}</dd>
            </div>
            <div className="card__detail">
              <dt>Email</dt>
              <dd>{contact.email ? contact.email : '—'}</dd>
            </div>
            <div className="card__detail">
              <dt>Статус</dt>
              <dd>
                <span className={`status status--${contact.statusId}`}>{statusLabel}</span>
              </dd>
            </div>
            <div className="card__detail">
              <dt>Дата создания</dt>
              <dd>{formatDate(contact.createdAt)}</dd>
            </div>
          </dl>

          <div className="card__actions">
            <Button variant="primary" onClick={onStartEdit}>
              Редактировать
            </Button>
            <Button variant="danger" onClick={() => onDelete(contact)}>
              Удалить
            </Button>
          </div>
        </>
      ) : null}

      {contact && isEditing ? (
        <ContactForm
          mode="edit"
          contact={contact}
          statuses={statuses}
          submitLabel="Сохранить изменения"
          serverError={updateMutation.isError ? (updateMutation.error as Error).message : null}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({ id: contact.id, input: values });
            onCancelEdit();
          }}
          onCancel={onCancelEdit}
        />
      ) : null}
    </aside>
  );
}
