import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiBell, FiTrash2 } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SkeletonRows,
  Modal,
  Input,
  Textarea,
} from '../../components/ui';
import { formatDateTime } from '../../lib/format';

const emptyForm = { title: '', announcement: '' };

const Announcements = () => {
  const { data: announcements, loading, error, reload } = useApi('/announcement/getall', {
    select: (d) => d.announcement,
  });

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
      await api.post('/announcement', form);
      toast.success('Announcement posted');
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
      await api.delete(`/announcement/${confirmDelete._id}`);
      toast.success('Announcement deleted');
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Visible to every teacher and student in the school"
        action={
          <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
            New announcement
          </Button>
        }
      />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={4} cols={2} />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={FiBell}
            title="Nothing announced yet"
            description="Post an announcement to reach the whole school at once."
            action={
              <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
                New announcement
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {announcements.map((item) => (
              <li key={item._id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">
                    {item.announcement}
                  </p>
                  <p className="mt-1.5 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                </div>
                <Button
                  variant="dangerGhost"
                  size="sm"
                  icon={FiTrash2}
                  aria-label={`Delete ${item.title}`}
                  onClick={() => setConfirmDelete(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="New announcement">
        <form onSubmit={create} className="space-y-4" noValidate>
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Parent-teacher meeting"
            required
          />
          <Textarea
            label="Message"
            name="announcement"
            rows={5}
            value={form.announcement}
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
        title="Delete announcement?"
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

export default Announcements;
