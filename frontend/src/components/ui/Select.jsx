import Field from './Field';

const Select = ({ label, hint, error, required, className = '', id, children, ...props }) => {
  const inputId = id || props.name;

  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <select
        id={inputId}
        className={`block w-full appearance-none rounded-md border bg-surface px-3 py-2 text-sm text-ink transition-colors disabled:opacity-60 ${
          error ? 'border-danger' : 'border-line'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
};

export default Select;
