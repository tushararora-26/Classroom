import { NavLink } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { NAV, ROLE_LABEL } from './navConfig';

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-muted hover:bg-ground hover:text-ink'
  }`;

const Sidebar = ({ onNavigate, onClose }) => {
  const { role, school } = useAuth();
  const items = NAV[role] || [];

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            C
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {school?.name || 'Classroom'}
            </p>
            {school?.code && (
              <p className="truncate text-[11px] text-muted">Code {school.code}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-muted hover:bg-ground hover:text-ink lg:hidden"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted">
          {ROLE_LABEL[role] || ''}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
