import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCheckSquare,
  FiFileText,
  FiBell,
  FiLayers,
  FiBookOpen,
  FiArrowRight,
} from 'react-icons/fi';

const FEATURES = [
  { icon: FiLayers, title: 'Classes & subjects', body: 'Build classes, assign teachers to subjects, and keep rosters accurate.' },
  { icon: FiUsers, title: 'Students & staff', body: 'One record per person, with the class and subject history attached.' },
  { icon: FiCheckSquare, title: 'Attendance', body: 'Mark a register in seconds; students see their own percentage.' },
  { icon: FiFileText, title: 'Assignments', body: 'Set work with deadlines, collect submissions, and return grades.' },
  { icon: FiBell, title: 'Notices', body: 'Class notices from teachers, school-wide announcements from admin.' },
  { icon: FiBookOpen, title: 'Library', body: 'Track the school catalogue and search Google Books alongside it.' },
];

const Home = () => (
  <div className="min-h-screen bg-ground">
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            C
          </span>
          <span className="text-sm font-semibold text-ink">Classroom</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/choose"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-ground hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            to="/admin/register"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Register a school
          </Link>
        </div>
      </div>
    </header>

    <main>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            School management, without the spreadsheets
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            One place to run your school
          </h1>
          <p className="mt-4 text-lg text-muted">
            Classroom gives administrators, teachers and students each their own
            view of the same information — rosters, attendance, assignments and
            notices — with everything scoped to the people who should see it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/admin/register"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              Get started
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/choose"
              className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-ground"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            What is included
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
        Classroom — school management system
      </div>
    </footer>
  </div>
);

export default Home;
