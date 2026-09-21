import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiFileText, FiUpload } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  ErrorState,
  SkeletonRows,
  Modal,
  Textarea,
  Input,
} from '../../components/ui';
import { formatDate, formatDateTime, relativeDeadline } from '../../lib/format';

const StudentAssignments = () => {
  const { data: assignments, loading, error, reload } = useApi('/students/me/assignments', {
    select: (d) => d.assignments,
  });

  const [submitting, setSubmitting] = useState(null);
  const [form, setForm] = useState({ content: '', fileUrl: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const openSubmit = (assignment) => {
    setForm({
      content: assignment.submission?.content || '',
      fileUrl: assignment.submission?.fileUrl || '',
    });
    setFormError('');
    setSubmitting(assignment);
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      await api.post(`/assignments/${submitting._id}/submissions`, form);
      toast.success('Submitted');
      setSubmitting(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Assignments"
        description={assignments ? `${assignments.length} for your class` : null}
      />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={3} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No assignments"
            description="Work set for your class will appear here. If you are not in a class yet, ask your administrator to enrol you."
          />
        ) : (
          <ul className="divide-y divide-line">
            {assignments.map((assignment) => {
              const due = relativeDeadline(assignment.deadline);
              const overdue = new Date(assignment.deadline) < new Date();
              const submission = assignment.submission;

              return (
                <li key={assignment._id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{assignment.title}</p>
                        {submission?.grade ? (
                          <Badge tone="success">Graded {submission.grade}</Badge>
                        ) : submission ? (
                          <Badge tone="accent">Submitted</Badge>
                        ) : overdue ? (
                          <Badge tone="danger">Missed</Badge>
                        ) : (
                          <Badge tone={due.tone}>{due.label}</Badge>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted">
                        {assignment.description}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {assignment.class?.class} · due {formatDate(assignment.deadline)}
                        {assignment.teacher?.name ? ` · set by ${assignment.teacher.name}` : ''}
                      </p>
                    </div>

                    {!overdue && (
                      <Button
                        variant={submission ? 'secondary' : 'primary'}
                        size="sm"
                        icon={FiUpload}
                        onClick={() => openSubmit(assignment)}
                      >
                        {submission ? 'Resubmit' : 'Submit'}
                      </Button>
                    )}
                  </div>

                  {submission && (
                    <div className="mt-3 rounded-md border border-line bg-ground/60 px-3 py-2.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Your submission · {formatDateTime(submission.submittedAt)}
                      </p>
                      {submission.content && (
                        <p className="mt-1.5 whitespace-pre-line text-sm text-ink">
                          {submission.content}
                        </p>
                      )}
                      {submission.fileUrl && (
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-1.5 inline-block text-sm font-medium text-accent hover:underline"
                        >
                          Attached link
                        </a>
                      )}
                      {submission.feedback && (
                        <p className="mt-2 border-t border-line pt-2 text-sm text-muted">
                          <span className="font-medium text-ink">Feedback:</span>{' '}
                          {submission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={Boolean(submitting)}
        onClose={() => setSubmitting(null)}
        title={submitting?.title || ''}
        description={
          submitting?.submission
            ? 'Resubmitting replaces your previous answer and clears any grade.'
            : 'Write your answer, attach a link, or both.'
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Textarea
            label="Your answer"
            name="content"
            rows={6}
            value={form.content}
            onChange={(event) => setForm((c) => ({ ...c, content: event.target.value }))}
          />
          <Input
            label="Link to a file"
            name="fileUrl"
            type="url"
            value={form.fileUrl}
            onChange={(event) => setForm((c) => ({ ...c, fileUrl: event.target.value }))}
            placeholder="https://drive.google.com/…"
            hint="Optional — a shared document or drive link"
          />

          {formError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setSubmitting(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default StudentAssignments;
