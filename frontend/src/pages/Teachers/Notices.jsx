import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiBell, FiTrash2 } from 'react-icons/fi';
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
import { formatDateTime } from '../../lib/format';

const emptyForm = { classId: '', title: '', content: '' };

const TeacherNotices = () => {
  const { data: notices, loading, error, reload } = useApi('/notices/getall', {
    select: (d) => d.notices,
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
      await api.post(`/notices/${form.classId}`, { title: form.title, content: form.content });
      toast.success('Notice posted');
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
      await api.delete(`/notices/${confirmDelete._id}`);
      toast.success('Notice deleted');
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
        title="Notices"
        description="Posted to a single class, visible to its students"
        action={
          <Button icon={FiPlus} onClick={() => setDialogOpen(true)} disabled={noClasses}>
            New notice
          </Button>
        }
      />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={2} />
        ) : notices.length === 0 ? (
          <EmptyState
            icon={FiBell}
            title="No notices posted"
            description={
              noClasses
                ? 'You need to be assigned to a class before you can post notices.'
                : 'Post a notice to tell one class something.'
            }
            action={
              !noClasses && (
                <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
                  New notice
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {notices.map((notice) => (
              <li key={notice._id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{notice.title}</p>
                    <Badge tone="accent">{notice.class?.class}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">{notice.content}</p>
                  <p className="mt-1.5 text-xs text-muted">{formatDateTime(notice.createdAt)}</p>
                </div>
                <Button
                  variant="dangerGhost"
                  size="sm"
                  icon={FiTrash2}
                  aria-label={`Delete ${notice.title}`}
                  onClick={() => setConfirmDelete(notice)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="New notice">
        <form onSubmit={create} className="space-y-4" noValidate>
          <Select label="Class" name="classId" value={form.classId} onChange={onChange} required>
            <option value="">Select a class…</option>
            {(classes || []).map((klass) => (
              <option key={klass._id} value={klass._id}>
                {klass.class}
              </option>
            ))}
          </Select>
          <Input label="Title" name="title" value={form.title} onChange={onChange} required />
          <Textarea
            label="Message"
            name="content"
            rows={5}
            value={form.content}
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
              Post
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete notice?"
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
          <span className="font-medium text-ink">{confirmDelete?.title}</span> will be deleted.
        </p>
      </Modal>
    </>
  );
};

export default TeacherNotices;
