import Field from './Field';

const Textarea = ({ label, hint, error, required, className = '', id, rows = 4, ...props }) => {
  const inputId = id || props.name;

  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <textarea
        id={inputId}
        rows={rows}
        className={`block w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors disabled:opacity-60 ${
          error ? 'border-danger' : 'border-line'
        } ${className}`}
        {...props}
      />
    </Field>
  );
};

export default Textarea;
