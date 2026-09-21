export const Card = ({ className = '', children, ...props }) => (
  <div
    className={`rounded-lg border border-line bg-surface shadow-card ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, description, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 border-b border-line px-5 py-4 ${className}`}>
    <div className="min-w-0">
      <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardBody = ({ className = '', children }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
);

export default Card;
