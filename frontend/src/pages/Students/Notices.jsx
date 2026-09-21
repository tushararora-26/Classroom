import { FiBell } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from '../../components/ui';
import { formatDateTime } from '../../lib/format';

const StudentNotices = () => {
  const { data: notices, loading, error, reload } = useApi('/students/me/notices', {
    select: (d) => d.notices,
  });

  return (
    <>
      <PageHeader title="Notices" description="From the teachers of your class" />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={2} />
        ) : notices.length === 0 ? (
          <EmptyState
            icon={FiBell}
            title="No notices"
            description="Notices your teachers post to your class will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {notices.map((notice) => (
              <li key={notice._id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">{notice.title}</p>
                  {notice.class?.class && <Badge tone="accent">{notice.class.class}</Badge>}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{notice.content}</p>
                <p className="mt-1.5 text-xs text-muted">{formatDateTime(notice.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
};

export default StudentNotices;
