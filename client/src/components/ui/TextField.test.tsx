import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Modal } from './Modal';
import { TextField } from './TextField';

describe('TextField', () => {
  it('генерирует уникальные id, когда на странице несколько форм', () => {
    render(
      <div>
        <TextField label="ФИО" />
        <TextField label="Компания" />
        <Modal isOpen title="Новый контакт" onClose={() => {}}>
          <TextField label="ФИО" />
          <TextField label="Компания" />
        </Modal>
      </div>,
    );

    const ids = Array.from(document.querySelectorAll('input')).map((input) => input.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('подпись связана со своим полем', () => {
    render(<TextField label="ФИО" />);

    const label = screen.getByText('ФИО');
    const input = screen.getByLabelText('ФИО');

    expect(label.getAttribute('for')).toBe(input.id);
  });
});
