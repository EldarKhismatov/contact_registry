import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactStatus } from '@shared/types';

import { ContactForm } from './ContactForm';
import { getDraftKey } from './draftStorage';

const statuses: ContactStatus[] = [
  { id: 'new', label: 'Новый' },
  { id: 'active', label: 'Активный' },
];

function renderForm() {
  return render(
    <ContactForm
      mode="create"
      statuses={statuses}
      submitLabel="Создать контакт"
      onSubmit={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe('черновик формы', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('сохраняет введённые данные в localStorage и восстанавливает их', async () => {
    const user = userEvent.setup();
    const view = renderForm();

    await user.type(screen.getByLabelText('ФИО'), 'Анна Ковалёва');
    await user.type(screen.getByLabelText('Компания'), 'ООО «Северный Ветер»');

    const draftKey = getDraftKey('create');

    await waitFor(
      () => {
        expect(window.localStorage.getItem(draftKey)).toContain('Анна Ковалёва');
      },
      { timeout: 2000 },
    );

    // Форма закрывается и открывается заново — данные должны восстановиться.
    view.unmount();
    renderForm();

    expect(screen.getByText('Восстановлены несохранённые данные')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('ФИО')).toHaveValue('Анна Ковалёва');
    });
    expect(screen.getByLabelText('Компания')).toHaveValue('ООО «Северный Ветер»');
  });

  it('очищает черновик по кнопке «Очистить»', async () => {
    const user = userEvent.setup();
    const view = renderForm();

    await user.type(screen.getByLabelText('ФИО'), 'Анна Ковалёва');

    const draftKey = getDraftKey('create');

    await waitFor(
      () => {
        expect(window.localStorage.getItem(draftKey)).toContain('Анна Ковалёва');
      },
      { timeout: 2000 },
    );

    view.unmount();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Очистить' }));

    expect(screen.queryByText('Восстановлены несохранённые данные')).not.toBeInTheDocument();
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(window.localStorage.getItem(draftKey)).toBeNull();
  });

  it('не показывает баннер, если черновика нет', () => {
    renderForm();

    expect(screen.queryByText('Восстановлены несохранённые данные')).not.toBeInTheDocument();
  });
});
