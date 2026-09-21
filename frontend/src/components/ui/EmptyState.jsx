const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    {Icon && (
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ground text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
    )}
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
