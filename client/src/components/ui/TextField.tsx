import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Сообщение об ошибке: поле подсвечивается и получает aria-invalid. */
  error?: string;
  hint?: string;
}

/** Текстовое поле с подписью, подсказкой и сообщением об ошибке. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  // Идентификатор генерируется, а не собирается из подписи: на странице может
  // одновременно быть несколько форм (карточка и модальное окно), и одинаковые
  // id ломают связь «подпись — поле» (label for / getByLabel).
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  const classes = ['field', error ? 'field--invalid' : null, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className="field__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        {...rest}
      />
      {!error && hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
