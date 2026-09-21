import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiCalendar, FiTrash2 } from 'react-icons/fi';
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
} from '../../components/ui';
import { formatDate } from '../../lib/format';

const emptyForm = { title: '', date: '', description: '' };

const Events = () => {
  const { data: events, loading, error, reload } = useApi('/events/getall', {
    select: (d) => d.events,
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
      await api.post('/events', form);
      toast.success('Event created');
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
      await api.delete(`/events/${confirmDelete._id}`);
      toast.success('Event deleted');
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Events"
        description={events ? `${events.length} scheduled` : null}
        action={
          <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
            New event
          </Button>
        }
      />

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={5} cols={3} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No events scheduled"
            description="Sports days, exhibitions, holidays — anything the whole school should know about."
            action={
              <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
                New event
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => {
              const past = new Date(event.date) < now;

              return (
                <li key={event._id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{event.title}</p>
                      <Badge tone={past ? 'neutral' : 'accent'}>
                        {past ? 'Past' : formatDate(event.date)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{event.description}</p>
                    {past && (
                      <p className="mt-1 text-xs text-muted">{formatDate(event.date)}</p>
                    )}
                  </div>
                  <Button
                    variant="dangerGhost"
                    size="sm"
                    icon={FiTrash2}
                    aria-label={`Delete ${event.title}`}
                    onClick={() => setConfirmDelete(event)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="New event">
        <form onSubmit={create} className="space-y-4" noValidate>
          <Input label="Title" name="title" value={form.title} onChange={onChange} required />
          <Input label="Date" name="date" type="date" value={form.date} onChange={onChange} required />
          <Textarea
            label="Description"
            name="description"
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
              Create event
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete event?"
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

export default Events;
