import Field from './Field';

const base =
  'block w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const Input = ({ label, hint, error, required, className = '', id, ...props }) => {
  const inputId = id || props.name;

  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        className={`${base} ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...props}
      />
    </Field>
  );
};

export default Input;
