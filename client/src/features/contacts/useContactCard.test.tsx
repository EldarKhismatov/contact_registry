import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useContactCard } from './useContactCard';

function TestScreen() {
  const { contactId, open, close } = useContactCard();
  const location = useLocation();

  return (
    <div>
      <span data-testid="contact-id">{contactId ?? 'нет'}</span>
      <span data-testid="search">{location.search}</span>
      <button type="button" onClick={() => open('contact-1')}>
        открыть
      </button>
      <button type="button" onClick={() => open('contact-2')}>
        открыть другую
      </button>
      <button type="button" onClick={close}>
        закрыть
      </button>
    </div>
  );
}

function renderScreen() {
  render(
    <BrowserRouter>
      <TestScreen />
    </BrowserRouter>,
  );
}

async function goBack() {
  await act(async () => {
    window.history.back();
  });
}

describe('useContactCard', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    // Возвращаемся к списку, чтобы следующий тест начинался с чистой истории.
    window.history.replaceState(null, '', '/');
  });

  it('отражает открытую карточку в адресной строке', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'открыть' }));

    expect(screen.getByTestId('contact-id')).toHaveTextContent('contact-1');
    expect(screen.getByTestId('search')).toHaveTextContent('id=contact-1');
  });

  it('закрывает карточку кнопкой «Назад» в браузере', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'открыть' }));
    expect(screen.getByTestId('contact-id')).toHaveTextContent('contact-1');

    await goBack();

    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('нет');
    });
    expect(screen.getByTestId('search')).toHaveTextContent('');
  });

  it('не плодит записи в истории при повторном открытии той же записи', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'открыть' }));
    await user.click(screen.getByRole('button', { name: 'открыть' }));

    expect(screen.getByTestId('contact-id')).toHaveTextContent('contact-1');

    // Если бы каждое открытие добавляло запись в историю, «Назад» вернул бы
    // нас к той же открытой карточке, а не к списку.
    await goBack();

    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('нет');
    });
  });

  it('не добавляет запись в историю при переключении на другую карточку', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'открыть' }));
    await user.click(screen.getByRole('button', { name: 'открыть другую' }));

    expect(screen.getByTestId('contact-id')).toHaveTextContent('contact-2');

    await goBack();

    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('нет');
    });
  });

  it('закрывает карточку кнопкой «Закрыть»', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'открыть' }));
    await user.click(screen.getByRole('button', { name: 'закрыть' }));

    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('нет');
    });
    expect(screen.getByTestId('search')).toHaveTextContent('');
  });
});
