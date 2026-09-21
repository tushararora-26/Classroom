import { Link } from 'react-router-dom';
import { FiLayers, FiUsers, FiFileText, FiBell, FiCalendar } from 'react-icons/fi';
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
import { formatDate, relativeDeadline } from '../../lib/format';

const TeacherDashboard = () => {
  const { user } = useAuth();

  const { data, loading, error, reload } = useApiAll({
    classes: '/teachers/me/classes',
    assignments: '/teachers/me/assignments',
    events: '/events/getall',
    announcements: '/announcement/getall',
  });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const classes = data?.classes?.classes || [];
  const assignments = data?.assignments?.assignments || [];
  const events = data?.events?.events || [];
  const announcements = data?.announcements?.announcement || [];

  const studentCount = classes.reduce((total, klass) => total + (klass.students?.length || 0), 0);
  const upcoming = assignments
    .filter((a) => new Date(a.deadline) >= new Date())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Teacher'}`}
        description={user?.subject ? `Teaching ${user.subject}` : null}
      />

      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="My classes" value={classes.length} icon={FiLayers} to="/teacher/classes" />
          <StatCard label="Students taught" value={studentCount} icon={FiUsers} tone="success" />
          <StatCard
            label="Assignments set"
            value={assignments.length}
            icon={FiFileText}
            to="/teacher/assignments"
            tone="warning"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My classes"
            action={
              <Link to="/teacher/classes" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          {loading ? (
            <CardBody>
              <div className="h-4 animate-pulse rounded bg-line/70" />
            </CardBody>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={FiLayers}
              title="No classes assigned"
              description="Your administrator assigns you to classes."
            />
          ) : (
            <ul className="divide-y divide-line">
              {classes.map((klass) => (
                <li key={klass._id}>
                  <Link
                    to={`/teacher/classes/${klass._id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-ground/60"
                  >
                    <span className="text-sm font-medium text-ink">{klass.class}</span>
                    <Badge>{klass.students?.length || 0} students</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming deadlines"
            action={
              <Link
                to="/teacher/assignments"
                className="text-xs font-medium text-accent hover:underline"
              >
                View all
              </Link>
            }
          />
          {loading ? (
            <CardBody>
              <div className="h-4 animate-pulse rounded bg-line/70" />
            </CardBody>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={FiFileText}
              title="No upcoming deadlines"
              description="Assignments you set will appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((assignment) => {
                const due = relativeDeadline(assignment.deadline);

                return (
                  <li
                    key={assignment._id}
                    className="flex items-start justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{assignment.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {assignment.class?.class} · due {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    <Badge tone={due.tone}>{due.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="School announcements" />
          {announcements.length === 0 ? (
            <EmptyState icon={FiBell} title="Nothing announced" />
          ) : (
            <ul className="divide-y divide-line">
              {announcements.slice(0, 4).map((item) => (
                <li key={item._id} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.announcement}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming events" />
          {events.filter((e) => new Date(e.date) >= new Date()).length === 0 ? (
            <EmptyState icon={FiCalendar} title="No upcoming events" />
          ) : (
            <ul className="divide-y divide-line">
              {events
                .filter((e) => new Date(e.date) >= new Date())
                .slice(0, 4)
                .map((event) => (
                  <li key={event._id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <Badge tone="accent">{formatDate(event.date)}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default TeacherDashboard;
