interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Загрузка' }: SpinnerProps) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
