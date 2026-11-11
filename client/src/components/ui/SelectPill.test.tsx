import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SelectPill, type SelectPillOption } from './SelectPill';

const fewOptions: SelectPillOption[] = [
  { value: 'new', label: 'Новый' },
  { value: 'active', label: 'Активный' },
];

const manyOptions: SelectPillOption[] = Array.from({ length: 10 }, (_, index) => ({
  value: `option-${index}`,
  label: `Вариант ${index}`,
}));

describe('SelectPill', () => {
  it('показывает выбранное значение', () => {
    render(<SelectPill value="active" options={fewOptions} onChange={() => {}} />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Активный');
  });

  it('открывает панель со списком вариантов', async () => {
    const user = userEvent.setup();
    render(<SelectPill value="new" options={fewOptions} onChange={() => {}} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Активный' })).toBeInTheDocument();
  });

  it('сообщает о выборе варианта', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectPill value="new" options={fewOptions} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Активный' }));

    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('не показывает поиск, когда вариантов не больше восьми', async () => {
    const user = userEvent.setup();
    render(<SelectPill value="new" options={fewOptions} onChange={() => {}} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.queryByLabelText('Поиск по вариантам')).not.toBeInTheDocument();
  });

  it('показывает поиск, когда вариантов больше восьми, и фильтрует по нему', async () => {
    const user = userEvent.setup();
    render(<SelectPill value="option-0" options={manyOptions} onChange={() => {}} />);

    await user.click(screen.getByRole('combobox'));

    const search = screen.getByLabelText('Поиск по вариантам');
    expect(search).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(10);

    await user.type(search, 'Вариант 7');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Вариант 7' })).toBeInTheDocument();
  });

  it('закрывается по Escape', async () => {
    const user = userEvent.setup();
    render(<SelectPill value="new" options={fewOptions} onChange={() => {}} />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
