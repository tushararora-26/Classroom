import { Link } from 'react-router-dom';
import { FiShield, FiUserCheck, FiUser, FiArrowRight } from 'react-icons/fi';

const ROLES = [
  {
    to: '/admin/signin',
    icon: FiShield,
    title: 'Administrator',
    body: 'Manage classes, teachers, students, the library and school-wide announcements.',
  },
  {
    to: '/teacher/signin',
    icon: FiUserCheck,
    title: 'Teacher',
    body: 'Take attendance, set and grade assignments, and post notices to your classes.',
  },
  {
    to: '/student/signin',
    icon: FiUser,
    title: 'Student',
    body: 'See your assignments and grades, your attendance record, and your notices.',
  },
];

const ChooseUser = () => (
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
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in as</h1>
          <p className="mt-1 text-sm text-muted">
            Each role sees a different view of the school.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map(({ to, icon: Icon, title, body }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Continue
                <FiArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Setting up a new school?{' '}
          <Link to="/admin/register" className="font-medium text-accent hover:underline">
            Register one
          </Link>
        </p>
      </div>
    </main>
  </div>
);

export default ChooseUser;
