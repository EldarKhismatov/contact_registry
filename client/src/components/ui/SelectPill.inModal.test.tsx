import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';
import { SelectPill } from './SelectPill';

const options = [
  { value: 'new', label: 'Новый' },
  { value: 'active', label: 'Активный' },
];

/**
 * Escape внутри панели выбора не должен закрывать родительское модальное окно:
 * иначе невозможно закрыть выпадающий список, не потеряв введённые данные.
 */
describe('пилюля внутри модального окна', () => {
  it('Escape в панели не закрывает модальное окно', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Новый контакт" onClose={onClose}>
        <SelectPill value="new" options={options} onChange={() => {}} ariaLabel="Статус" />
      </Modal>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Статус' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Escape в самом модальном окне закрывает его', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Новый контакт" onClose={onClose}>
        <SelectPill value="new" options={options} onChange={() => {}} ariaLabel="Статус" />
      </Modal>,
    );

    screen.getByRole('dialog').focus();
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
