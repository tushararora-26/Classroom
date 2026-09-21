import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  Badge,
  Avatar,
  EmptyState,
  ErrorState,
  Skeleton,
  Modal,
  Input,
  Textarea,
  StatCard,
} from '../../components/ui';
import { formatDate, formatDateTime } from '../../lib/format';

const Submissions = () => {
  const { assignmentId } = useParams();

  const { data, loading, error, reload } = useApi(`/assignments/${assignmentId}/submissions`, {
    deps: [assignmentId],
  });

  const [grading, setGrading] = useState(null);
  const [form, setForm] = useState({ grade: '', feedback: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const openGrading = (submission) => {
    setForm({ grade: submission.grade || '', feedback: submission.feedback || '' });
    setFormError('');
    setGrading(submission);
  };

  const submitGrade = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      await api.patch(`/submissions/${grading._id}/grade`, form);
      toast.success('Grade saved');
      setGrading(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (loading) {
    return (
      <>
        <Skeleton className="h-7 w-56" />
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
        </Card>
      </>
    );
  }

  const { assignment, submissions, missing } = data;
  const graded = submissions.filter((s) => s.grade).length;

  return (
    <>
      <Link
        to="/teacher/assignments"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <FiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Assignments
      </Link>

      <PageHeader
        title={assignment.title}
        description={`Due ${formatDate(assignment.deadline)}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Submitted" value={submissions.length} icon={FiCheckCircle} tone="success" />
        <StatCard label="Graded" value={graded} icon={FiCheckCircle} />
        <StatCard label="Not submitted" value={missing.length} icon={FiClock} tone="warning" />
      </div>

      <Card>
        <CardHeader title="Submissions" />
        {submissions.length === 0 ? (
          <EmptyState
            icon={FiClock}
            title="Nothing submitted yet"
            description="Submissions appear here as students hand work in."
          />
        ) : (
          <ul className="divide-y divide-line">
            {submissions.map((submission) => (
              <li key={submission._id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={submission.student?.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {submission.student?.name}
                      </p>
                      <p className="text-xs text-muted">
                        {submission.student?.registrationNumber} ·{' '}
                        {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {submission.grade ? (
                      <Badge tone="success">Graded {submission.grade}</Badge>
                    ) : (
                      <Badge tone="warning">Awaiting grade</Badge>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => openGrading(submission)}>
                      {submission.grade ? 'Change grade' : 'Grade'}
                    </Button>
                  </div>
                </div>

                {submission.content && (
                  <p className="mt-3 whitespace-pre-line rounded-md border border-line bg-ground/60 px-3 py-2 text-sm text-ink">
                    {submission.content}
                  </p>
                )}

                {submission.fileUrl && (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                  >
                    Open attached link
                  </a>
                )}

                {submission.feedback && (
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-medium text-ink">Feedback:</span> {submission.feedback}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {missing.length > 0 && (
        <Card>
          <CardHeader title="Not submitted" description={`${missing.length} students`} />
          <ul className="divide-y divide-line">
            {missing.map((student) => (
              <li key={student._id} className="flex items-center gap-2.5 px-5 py-3">
                <Avatar name={student.name} size="sm" />
                <span className="text-sm text-ink">{student.name}</span>
                <span className="ml-auto text-xs tabular-nums text-muted">
                  {student.registrationNumber}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={Boolean(grading)}
        onClose={() => setGrading(null)}
        title={`Grade ${grading?.student?.name || ''}`}
        size="md"
      >
        <form onSubmit={submitGrade} className="space-y-4" noValidate>
          <Input
            label="Grade"
            name="grade"
            value={form.grade}
            onChange={(event) => setForm((c) => ({ ...c, grade: event.target.value }))}
            placeholder="A, 85%, Pass…"
            required
          />
          <Textarea
            label="Feedback"
            name="feedback"
            rows={4}
            value={form.feedback}
            onChange={(event) => setForm((c) => ({ ...c, feedback: event.target.value }))}
            placeholder="What went well, and what to work on."
          />

          {formError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setGrading(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Save grade
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Submissions;
