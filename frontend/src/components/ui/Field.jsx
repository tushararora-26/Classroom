/** Shared label + hint + error scaffolding for every form control. */
const Field = ({ label, htmlFor, hint, error, required, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

export default Field;
