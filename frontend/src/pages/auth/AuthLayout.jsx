import { Link } from 'react-router-dom';

const AuthLayout = ({ title, description, children, footer }) => (
  <div className="flex min-h-screen flex-col bg-ground">
    <header className="flex h-14 items-center px-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          C
        </span>
        <span className="text-sm font-semibold text-ink">Classroom</span>
      </Link>
    </header>

    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-card">{children}</div>

        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  </div>
);

export default AuthLayout;
