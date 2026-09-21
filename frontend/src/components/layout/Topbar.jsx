import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiMoon, FiSun, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_LABEL } from './navConfig';
import Avatar from '../ui/Avatar';

const LABELS = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  classes: 'Classes',
  students: 'Students',
  teachers: 'Teachers',
  assignments: 'Assignments',
  attendance: 'Attendance',
  announcements: 'Announcements',
  notices: 'Notices',
  library: 'Library',
  events: 'Events',
  profile: 'Profile',
  submissions: 'Submissions',
  new: 'New',
};

/** Breadcrumbs from the path, skipping any segment that looks like an id. */
const useCrumbs = () => {
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);

  return segments
    .filter((segment) => !/^[0-9a-f]{24}$/i.test(segment))
    .map((segment, index, all) => ({
      label: LABELS[segment] || segment.replace(/-/g, ' '),
      to: `/${all.slice(0, index + 1).join('/')}`,
      isLast: index === all.length - 1,
    }));
};

const Topbar = ({ onOpenMenu }) => {
  const { user, role, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const crumbs = useCrumbs();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onClickAway = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [menuOpen]);

  const handleSignOut = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-muted hover:bg-ground hover:text-ink lg:hidden"
      >
        <FiMenu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 truncate text-sm">
          {crumbs.map((crumb) => (
            <li key={crumb.to} className="flex items-center gap-1.5">
              {crumb.isLast ? (
                <span className="truncate font-medium capitalize text-ink">{crumb.label}</span>
              ) : (
                <>
                  <Link
                    to={crumb.to}
                    className="truncate capitalize text-muted transition-colors hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                  <span className="text-muted/60" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-ground hover:text-ink"
      >
        {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-ground"
        >
          <Avatar name={user?.name} size="sm" />
          <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:block">
            {user?.name}
          </span>
          <FiChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1.5 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
          >
            <div className="border-b border-line px-3 py-2.5">
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">
                {user?.email || user?.registrationNumber} · {ROLE_LABEL[role]}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <FiLogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
