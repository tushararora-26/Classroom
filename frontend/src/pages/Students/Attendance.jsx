import { FiCheckSquare, FiCheck, FiX } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  EmptyState,
  ErrorState,
  SkeletonRows,
  SkeletonCards,
} from '../../components/ui';
import { formatDate } from '../../lib/format';

const StudentAttendance = () => {
  const { data, loading, error, reload } = useApi('/students/me/attendance');

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const records = data?.attendanceRecords || [];
  const summary = data?.summary;

  const tone =
    summary?.percentage === null
      ? 'accent'
      : summary?.percentage >= 90
        ? 'success'
        : summary?.percentage >= 75
          ? 'warning'
          : 'danger';

  return (
    <>
      <PageHeader title="Attendance" description="Your own record, day by day" />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Rate"
            value={summary.percentage === null ? '—' : `${summary.percentage}%`}
            icon={FiCheckSquare}
            tone={tone}
          />
          <StatCard label="Days recorded" value={summary.total} />
          <StatCard label="Present" value={summary.present} tone="success" />
          <StatCard label="Absent" value={summary.absent} tone="danger" />
        </div>
      )}

      <Card>
        <CardHeader title="History" description="Most recent first" />
        {loading ? (
          <SkeletonRows rows={6} cols={2} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={FiCheckSquare}
            title="Nothing recorded yet"
            description="Your attendance appears here once a teacher takes the register for your class."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th className="text-right">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {records.map((record) => (
                <Tr key={record._id}>
                  <Td className="font-medium">{formatDate(record.date)}</Td>
                  <Td className="text-right">
                    <Badge tone={record.present ? 'success' : 'danger'}>
                      {record.present ? (
                        <>
                          <FiCheck className="h-3 w-3" aria-hidden="true" />
                          Present
                        </>
                      ) : (
                        <>
                          <FiX className="h-3 w-3" aria-hidden="true" />
                          Absent
                        </>
                      )}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
};

export default StudentAttendance;
