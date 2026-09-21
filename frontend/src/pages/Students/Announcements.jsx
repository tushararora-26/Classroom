import { FiBell } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { PageHeader, Card, EmptyState, ErrorState, SkeletonRows } from '../../components/ui';
import { formatDateTime } from '../../lib/format';

const StudentAnnouncements = () => {
  const { data: announcements, loading, error, reload } = useApi('/announcement/getall', {
    select: (d) => d.announcement,
  });

  return (
    <>
      <PageHeader title="Announcements" description="School-wide, from the administration" />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={2} />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={FiBell}
            title="Nothing announced"
            description="School-wide announcements will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {announcements.map((item) => (
              <li key={item._id} className="px-5 py-4">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{item.announcement}</p>
                <p className="mt-1.5 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
};

export default StudentAnnouncements;
