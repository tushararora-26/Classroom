import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiFileText, FiTrash2, FiUsers } from 'react-icons/fi';
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
  Input,
  Textarea,
  Select,
} from '../../components/ui';
import { formatDate, relativeDeadline, toDateInput } from '../../lib/format';

const emptyForm = { title: '', description: '', classId: '', deadline: '' };

const TeacherAssignments = () => {
  const { data: assignments, loading, error, reload } = useApi('/teachers/me/assignments', {
    select: (d) => d.assignments,
  });

  const { data: classes } = useApi('/teachers/me/classes', { select: (d) => d.classes });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      await api.post('/assignments', form);
      toast.success('Assignment created');
      setForm(emptyForm);
      setDialogOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);

    try {
      await api.delete(`/assignments/${confirmDelete._id}`);
      toast.success('Assignment deleted');
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const noClasses = classes && classes.length === 0;

  return (
    <>
      <PageHeader
        title="Assignments"
        description={assignments ? `${assignments.length} set across your classes` : null}
        action={
          <Button icon={FiPlus} onClick={() => setDialogOpen(true)} disabled={noClasses}>
            New assignment
          </Button>
        }
      />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={3} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No assignments yet"
            description={
              noClasses
                ? 'You need to be assigned to a class before you can set work.'
                : 'Set work with a deadline, then collect and grade submissions.'
            }
            action={
              !noClasses && (
                <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
                  New assignment
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {assignments.map((assignment) => {
              const due = relativeDeadline(assignment.deadline);

              return (
                <li key={assignment._id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{assignment.title}</p>
                      <Badge tone="accent">{assignment.class?.class}</Badge>
                      <Badge tone={due.tone}>{due.label}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {assignment.description}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Due {formatDate(assignment.deadline)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Link
                      to={`/teacher/assignments/${assignment._id}/submissions`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-ground"
                    >
                      <FiUsers className="h-3.5 w-3.5" aria-hidden="true" />
                      Submissions
                    </Link>
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      icon={FiTrash2}
                      aria-label={`Delete ${assignment.title}`}
                      onClick={() => setConfirmDelete(assignment)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="New assignment">
        <form onSubmit={create} className="space-y-4" noValidate>
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Quadratic equations worksheet"
            required
          />
          <Select label="Class" name="classId" value={form.classId} onChange={onChange} required>
            <option value="">Select a class…</option>
            {(classes || []).map((klass) => (
              <option key={klass._id} value={klass._id}>
                {klass.class}
              </option>
            ))}
          </Select>
          <Input
            label="Deadline"
            name="deadline"
            type="date"
            min={toDateInput(new Date())}
            value={form.deadline}
            onChange={onChange}
            required
          />
          <Textarea
            label="Instructions"
            name="description"
            rows={5}
            value={form.description}
            onChange={onChange}
            required
          />

          {formError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete assignment?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{confirmDelete?.title}</span> and every
          submission for it will be deleted. This cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default TeacherAssignments;
