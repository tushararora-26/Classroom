const PageHeader = ({ title, description, action, className = '' }) => (
  <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
