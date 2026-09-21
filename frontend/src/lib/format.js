const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATETIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value) => (value ? DATE.format(new Date(value)) : '—');

export const formatDateTime = (value) =>
  value ? DATETIME.format(new Date(value)) : '—';

/** Value for an <input type="date">, which needs YYYY-MM-DD. */
export const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || '?';

export const relativeDeadline = (value) => {
  if (!value) return { label: '—', tone: 'neutral' };

  const days = Math.ceil((new Date(value) - Date.now()) / 86400000);

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (days <= 7) return { label: `${days} days left`, tone: 'warning' };
  return { label: `${days} days left`, tone: 'neutral' };
};
