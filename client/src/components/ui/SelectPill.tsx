import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent } from 'react';

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

const PANEL_MAX_HEIGHT = 300;
const OPTION_HEIGHT = 34;

/**
 * Собственный выбор одного значения («пилюля») вместо нативного <select>.
 *
 * Особенности:
 *  - панель со списком вариантов, а не системный выпадающий список;
 *  - поиск по вариантам появляется только когда вариантов больше порога;
 *  - управление с клавиатуры (↑/↓, Home/End, Enter, пробел, Esc, Tab);
 *  - закрытие по клику вне и по Escape (Escape не закрывает родительское окно);
 *  - панель рендерится порталом, поэтому не обрезается родительскими контейнерами.
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
  const [panelPosition, setPanelPosition] = useState<CSSProperties | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const activeOption = visibleOptions[activeIndex];

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

  // Панель позиционируется относительно кнопки: снизу, а если места нет — сверху.
  const updatePanelPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const desiredHeight = visibleOptions.length * OPTION_HEIGHT + (showSearch ? 52 : 8) + 8;
    const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;

    setPanelPosition({
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      ...(openUp
        ? {
            bottom: `${window.innerHeight - rect.top + 4}px`,
            maxHeight: `${Math.min(PANEL_MAX_HEIGHT, spaceAbove - 8)}px`,
          }
        : {
            top: `${rect.bottom + 4}px`,
            maxHeight: `${Math.min(PANEL_MAX_HEIGHT, spaceBelow - 8)}px`,
          }),
    });
  }, [showSearch, visibleOptions.length]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePanelPosition();
    }
  }, [isOpen, updatePanelPosition]);

  // Панель должна следовать за кнопкой при прокрутке и изменении размера окна.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleViewportChange = () => updatePanelPosition();

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isOpen, updatePanelPosition]);

  // Закрытие по клику вне (учитываем и кнопку, и портал с панелью).
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Фокус на поле поиска, если оно есть; иначе фокус остаётся на кнопке.
  useEffect(() => {
    if (!isOpen || !showSearch) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen, showSearch]);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActive = (delta: number) => {
    setActiveIndex((index) => {
      if (visibleOptions.length === 0) {
        return 0;
      }

      return (index + delta + visibleOptions.length) % visibleOptions.length;
    });
  };

  /** Единая обработка клавиатуры для кнопки и для панели. */
  const handleListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
          return;
        }
        moveActive(1);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(Math.max(visibleOptions.length - 1, 0));
          return;
        }
        moveActive(-1);
        break;
      }
      case 'Home': {
        if (!isOpen) {
          return;
        }
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case 'End': {
        if (!isOpen) {
          return;
        }
        event.preventDefault();
        setActiveIndex(Math.max(visibleOptions.length - 1, 0));
        break;
      }
      case 'Enter':
      case ' ': {
        // В поле поиска пробел должен печататься, а не выбирать вариант.
        if (event.key === ' ' && event.target instanceof HTMLInputElement) {
          break;
        }

        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
          setActiveIndex(0);
          return;
        }

        const option = visibleOptions[activeIndex];
        if (option) {
          event.preventDefault();
          selectOption(option.value);
        }
        break;
      }
      case 'Escape': {
        if (!isOpen) {
          return;
        }
        // Останавливаем всплытие: Escape в панели не должен закрывать родительское окно.
        event.preventDefault();
        event.stopPropagation();
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

  const panel = isOpen ? (
    <div
      ref={panelRef}
      className="select-pill__panel"
      style={panelPosition ?? undefined}
      onKeyDown={handleListKeyDown}
    >
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

      <ul id={listboxId} className="select-pill__list" role="listbox">
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
  ) : null;

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
        onKeyDown={handleListKeyDown}
      >
        <span className={selected ? 'select-pill__value' : 'select-pill__placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="select-pill__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
