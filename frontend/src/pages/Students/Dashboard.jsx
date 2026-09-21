import { Link } from 'react-router-dom';
import { FiFileText, FiCheckSquare, FiBell, FiCalendar } from 'react-icons/fi';
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

const StudentDashboard = () => {
  const { user } = useAuth();

  const { data, loading, error, reload } = useApiAll({
    assignments: '/students/me/assignments',
    attendance: '/students/me/attendance',
    notices: '/students/me/notices',
    announcements: '/announcement/getall',
    events: '/events/getall',
  });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const assignments = data?.assignments?.assignments || [];
  const attendance = data?.attendance?.summary;
  const notices = data?.notices?.notices || [];
  const announcements = data?.announcements?.announcement || [];
  const events = (data?.events?.events || []).filter((e) => new Date(e.date) >= new Date());

  const pending = assignments.filter(
    (a) => !a.submission && new Date(a.deadline) >= new Date()
  );
  const graded = assignments.filter((a) => a.submission?.grade);

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
        description={
          user?.class
            ? null
            : 'You are not assigned to a class yet — ask your administrator to enrol you.'
        }
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="To submit"
            value={pending.length}
            icon={FiFileText}
            to="/student/assignments"
            tone={pending.length > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label="Graded"
            value={graded.length}
            icon={FiFileText}
            to="/student/assignments"
          />
          <StatCard
            label="Attendance"
            value={attendance?.percentage === null ? '—' : `${attendance?.percentage ?? 0}%`}
            hint={attendance ? `${attendance.present} of ${attendance.total} days` : null}
            icon={FiCheckSquare}
            to="/student/attendance"
            tone={
              attendance?.percentage === null || attendance?.percentage >= 90
                ? 'success'
                : attendance?.percentage >= 75
                  ? 'warning'
                  : 'danger'
            }
          />
          <StatCard label="Notices" value={notices.length} icon={FiBell} to="/student/notices" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Due soon"
            action={
              <Link
                to="/student/assignments"
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
          ) : pending.length === 0 ? (
            <EmptyState
              icon={FiFileText}
              title="Nothing due"
              description={
                user?.class
                  ? 'You are all caught up.'
                  : 'Assignments appear once you are enrolled in a class.'
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {pending.slice(0, 5).map((assignment) => {
                const due = relativeDeadline(assignment.deadline);

                return (
                  <li
                    key={assignment._id}
                    className="flex items-start justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{assignment.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    <Badge tone={due.tone}>{due.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Class notices"
            action={
              <Link
                to="/student/notices"
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
          ) : notices.length === 0 ? (
            <EmptyState icon={FiBell} title="No notices" />
          ) : (
            <ul className="divide-y divide-line">
              {notices.slice(0, 5).map((notice) => (
                <li key={notice._id} className="px-5 py-3">
                  <p className="text-sm font-medium text-ink">{notice.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notice.content}</p>
                </li>
              ))}
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
          {events.length === 0 ? (
            <EmptyState icon={FiCalendar} title="No upcoming events" />
          ) : (
            <ul className="divide-y divide-line">
              {events.slice(0, 4).map((event) => (
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

export default StudentDashboard;
