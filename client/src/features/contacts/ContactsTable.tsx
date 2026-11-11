import type { Contact, SortDirection, SortField } from '@shared/types';

import { formatDate } from './format';

interface ContactsTableProps {
  contacts: Contact[];
  sortBy: SortField;
  sortDir: SortDirection;
  /** Подписи статусов: id → название. */
  statusLabels: Record<string, string>;
  onSortChange: (field: SortField) => void;
  onOpen: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'ФИО' },
  { field: 'company', label: 'Компания' },
  { field: 'status', label: 'Статус' },
  { field: 'createdAt', label: 'Дата создания' },
];

export function ContactsTable({
  contacts,
  sortBy,
  sortDir,
  statusLabels,
  onSortChange,
  onOpen,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.field}
                scope="col"
                className="table__head"
                aria-sort={getAriaSort(sortBy, sortDir, column.field)}
              >
                <button
                  type="button"
                  className="table__sort-button"
                  onClick={() => onSortChange(column.field)}
                >
                  {column.label}
                  <span className="table__sort-icon" aria-hidden="true">
                    {getSortIcon(sortBy, sortDir, column.field)}
                  </span>
                </button>
              </th>
            ))}
            <th scope="col" className="table__head table__head--actions">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="table__row" onClick={() => onOpen(contact)}>
              <td className="table__cell">
                <button
                  type="button"
                  className="table__link"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(contact);
                  }}
                >
                  {contact.name}
                </button>
              </td>
              <td className="table__cell">{contact.company}</td>
              <td className="table__cell">
                <span className={`status status--${contact.statusId}`}>
                  {statusLabels[contact.statusId] ?? contact.statusId}
                </span>
              </td>
              <td className="table__cell table__cell--date">{formatDate(contact.createdAt)}</td>
              <td className="table__cell table__cell--actions">
                <button
                  type="button"
                  className="table__action"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(contact);
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="table__action table__action--danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(contact);
                  }}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getAriaSort(
  sortBy: SortField,
  sortDir: SortDirection,
  field: SortField,
): 'ascending' | 'descending' | 'none' {
  if (sortBy !== field) {
    return 'none';
  }

  return sortDir === 'asc' ? 'ascending' : 'descending';
}

function getSortIcon(sortBy: SortField, sortDir: SortDirection, field: SortField): string {
  if (sortBy !== field) {
    return '↕';
  }

  return sortDir === 'asc' ? '↑' : '↓';
}
