import { Link, useNavigate } from 'react-router-dom';
import { useAuth, HOME_FOR_ROLE } from '../context/AuthContext';

const Forbidden = () => {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ground px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">403</p>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        This area is not for your role
      </h1>
      <p className="max-w-sm text-sm text-muted">
        You are signed in{role ? ` as a ${role}` : ''}, which does not have access
        to this page.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link
          to={HOME_FOR_ROLE[role] || '/'}
          className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          Go to my dashboard
        </Link>
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/', { replace: true });
          }}
          className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-ground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
