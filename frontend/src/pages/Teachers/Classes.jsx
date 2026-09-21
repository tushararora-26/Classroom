import { Link } from 'react-router-dom';
import { FiLayers, FiUsers, FiArrowRight } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { PageHeader, Card, EmptyState, ErrorState, Skeleton, Badge } from '../../components/ui';

const TeacherClasses = () => {
  const { data: classes, loading, error, reload } = useApi('/teachers/me/classes', {
    select: (d) => d.classes,
  });

  return (
    <>
      <PageHeader
        title="My classes"
        description={classes ? `You teach ${classes.length} classes` : null}
      />

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-3 w-28" />
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={FiLayers}
            title="No classes assigned yet"
            description="Your school administrator assigns you to classes. Once they do, they appear here."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <Link
              key={klass._id}
              to={`/teacher/classes/${klass._id}`}
              className="group rounded-lg border border-line bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="truncate text-sm font-semibold text-ink">{klass.class}</h2>
                <FiArrowRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                <FiUsers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  <span className="font-medium tabular-nums text-ink">
                    {klass.students?.length || 0}
                  </span>{' '}
                  students
                </span>
              </div>
              {klass.teachers?.length > 1 && (
                <Badge className="mt-3">Shared with {klass.teachers.length - 1} other</Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default TeacherClasses;
