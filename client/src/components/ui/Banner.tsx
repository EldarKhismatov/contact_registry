import type { ReactNode } from 'react';

type BannerTone = 'info' | 'warning' | 'success' | 'error';

interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children?: ReactNode;
  /** Действие справа от текста (например, кнопка «Очистить»). */
  action?: ReactNode;
}

/** Информационная полоса: баннер восстановления черновика, ошибки и т. п. */
export function Banner({ tone = 'info', title, children, action }: BannerProps) {
  return (
    <div className={`banner banner--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="banner__content">
        {title ? <p className="banner__title">{title}</p> : null}
        {children ? <div className="banner__text">{children}</div> : null}
      </div>
      {action ? <div className="banner__action">{action}</div> : null}
    </div>
  );
}
