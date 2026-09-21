import { FiUsers, FiUserCheck, FiLayers, FiBookOpen, FiCalendar, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useApiAll } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardBody,
  SkeletonCards,
  ErrorState,
  EmptyState,
  Badge,
} from '../../components/ui';
import { formatDate } from '../../lib/format';

const AdminDashboard = () => {
  const { user, school } = useAuth();

  const { data, loading, error, reload } = useApiAll({
    classes: '/class/getall',
    students: '/students/getall',
    teachers: '/teachers/getall',
    events: '/events/getall',
    announcements: '/announcement/getall',
    library: '/library/getall?limit=1',
  });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const events = data?.events?.events || [];
  const announcements = data?.announcements?.announcement || [];
  const upcoming = events.filter((event) => new Date(event.date) >= new Date()).slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description={
          school ? `${school.name} · share code ${school.code} so staff and students can join` : null
        }
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={data.students.students.length}
            icon={FiUsers}
            to="/admin/students"
          />
          <StatCard
            label="Teachers"
            value={data.teachers.teachers.length}
            icon={FiUserCheck}
            to="/admin/teachers"
            tone="success"
          />
          <StatCard
            label="Classes"
            value={data.classes.classes.length}
            icon={FiLayers}
            to="/admin/classes"
            tone="warning"
          />
          <StatCard
            label="Library books"
            value={data.library.pagination?.total ?? 0}
            icon={FiBookOpen}
            to="/admin/library"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Upcoming events"
            action={
              <Link to="/admin/events" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {loading ? (
            <CardBody className="space-y-3">
              <div className="h-4 animate-pulse rounded bg-line/70" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
            </CardBody>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={FiCalendar}
              title="No upcoming events"
              description="Events you schedule will appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((event) => (
                <li key={event._id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{event.description}</p>
                  </div>
                  <Badge tone="accent">{formatDate(event.date)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent announcements"
            action={
              <Link
                to="/admin/announcements"
                className="text-xs font-medium text-accent hover:underline"
              >
                View all
              </Link>
            }
          />
          {loading ? (
            <CardBody className="space-y-3">
              <div className="h-4 animate-pulse rounded bg-line/70" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
            </CardBody>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={FiBell}
              title="No announcements yet"
              description="Post one to reach everyone in the school."
            />
          ) : (
            <ul className="divide-y divide-line">
              {announcements.slice(0, 5).map((item) => (
                <li key={item._id} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.announcement}</p>
                  <p className="mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;
