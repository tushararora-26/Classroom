import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
      <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium text-ink">Could not load this</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export default ErrorState;
