import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectPillOption {
  value: string;
  label: string;
}

interface SelectPillProps {
  value: string;
  options: SelectPillOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  ariaLabel?: string;
  /**
   * Порог, начиная с которого в панели появляется поиск.
   * По требованиям задания поиск нужен только если вариантов больше 8.
   */
  searchThreshold?: number;
}

/**
 * Собственный выбор одного значения («пилюля») вместо нативного <select>.
 *
 * Особенности:
 *  - панель со списком вариантов, а не системный выпадающий список;
 *  - поиск по вариантам появляется только когда вариантов больше порога;
 *  - управление с клавиатуры (↑/↓, Home/End, Enter, Esc, Tab);
 *  - закрытие по клику вне и по Escape.
 */
export function SelectPill({
  value,
  options,
  onChange,
  placeholder = 'Не выбрано',
  disabled = false,
  invalid = false,
  id,
  ariaLabel,
  searchThreshold = 8,
}: SelectPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const listboxId = useId();
  const optionId = (optionValue: string) => `${listboxId}-${optionValue}`;

  const selected = options.find((option) => option.value === value);
  const showSearch = options.length > searchThreshold;

  const visibleOptions = useMemo(() => {
    if (!showSearch) {
      return options;
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return options;
    }

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
    );
  }, [options, search, showSearch]);

  // Сбрасываем состояние панели при закрытии.
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // При вводе в поиск активным становится первый подходящий вариант.
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Закрытие по клику вне.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Фокус на панель (или на поле поиска) сразу после открытия.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, showSearch]);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(event.key === 'ArrowDown' ? 0 : Math.max(visibleOptions.length - 1, 0));
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setActiveIndex((index) => (visibleOptions.length === 0 ? 0 : (index + 1) % visibleOptions.length));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setActiveIndex((index) =>
          visibleOptions.length === 0 ? 0 : (index - 1 + visibleOptions.length) % visibleOptions.length,
        );
        break;
      }
      case 'Home': {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        setActiveIndex(Math.max(visibleOptions.length - 1, 0));
        break;
      }
      case 'Enter': {
        const option = visibleOptions[activeIndex];
        if (option) {
          event.preventDefault();
          selectOption(option.value);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      }
      case 'Tab': {
        // Tab закрывает панель, но не мешает переходу фокуса дальше.
        setIsOpen(false);
        break;
      }
      default:
        break;
    }
  };

  const activeOption = visibleOptions[activeIndex];

  return (
    <div className="select-pill" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        className={['select-pill__button', invalid ? 'select-pill__button--invalid' : null]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeOption ? optionId(activeOption.value) : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid ? true : undefined}
        disabled={disabled}
        onClick={() => setIsOpen((opened) => !opened)}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={selected ? 'select-pill__value' : 'select-pill__placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="select-pill__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="select-pill__panel" onKeyDown={handlePanelKeyDown}>
          {showSearch ? (
            <div className="select-pill__search-row">
              <input
                ref={searchInputRef}
                type="text"
                className="select-pill__search"
                value={search}
                placeholder="Поиск по вариантам"
                aria-label="Поиск по вариантам"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          ) : null}

          <ul
            id={listboxId}
            className="select-pill__list"
            role="listbox"
          >
            {visibleOptions.map((option, index) => {
              const isSelected = option.value === value;

              return (
                <li
                  key={option.value}
                  id={optionId(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'select-pill__option',
                    index === activeIndex ? 'select-pill__option--active' : null,
                    isSelected ? 'select-pill__option--selected' : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <span className="select-pill__check" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </li>
              );
            })}

            {visibleOptions.length === 0 ? (
              <li className="select-pill__empty">Ничего не найдено</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
