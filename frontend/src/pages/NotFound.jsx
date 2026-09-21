import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ground px-4 text-center">
    <p className="text-xs font-semibold uppercase tracking-widest text-muted">404</p>
    <h1 className="text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
    <p className="max-w-sm text-sm text-muted">
      The page you are looking for does not exist or has moved.
    </p>
    <Link
      to="/"
      className="mt-2 inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90"
    >
      Back to home
    </Link>
  </div>
);

export default NotFound;
