import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Avatar,
  ErrorState,
  Skeleton,
} from '../../components/ui';
import { formatDate } from '../../lib/format';

const StudentDetails = () => {
  const { studentId } = useParams();

  const { data: student, loading, error, reload } = useApi(`/students/${studentId}`, {
    select: (d) => d.student,
    deps: [studentId],
  });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (loading) {
    return (
      <>
        <Skeleton className="h-7 w-48" />
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <FiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All students
      </Link>

      <PageHeader title={student.name} description={`Registration ${student.registrationNumber}`} />

      <Card>
        <CardHeader title="Details" />
        <CardBody>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Avatar name={student.name} size="lg" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
                <dd className="text-sm font-medium text-ink">{student.name}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Registration number</dt>
              <dd className="mt-1 text-sm tabular-nums text-ink">{student.registrationNumber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Class</dt>
              <dd className="mt-1">
                {student.class ? (
                  <Link to={`/admin/classes/${student.class._id}`}>
                    <Badge tone="accent">{student.class.class}</Badge>
                  </Link>
                ) : (
                  <Badge>Unassigned</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Joined</dt>
              <dd className="mt-1 text-sm text-ink">{formatDate(student.createdAt)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </>
  );
};

export default StudentDetails;
