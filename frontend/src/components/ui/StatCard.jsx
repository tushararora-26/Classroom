import { Link } from 'react-router-dom';

const StatCard = ({ label, value, hint, icon: Icon, to, tone = 'accent' }) => {
  const tones = {
    accent: 'bg-accent-soft text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );

  const shell =
    'block rounded-lg border border-line bg-surface p-5 shadow-card transition-colors';

  return to ? (
    <Link to={to} className={`${shell} hover:border-accent/40`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
};

export default StatCard;
