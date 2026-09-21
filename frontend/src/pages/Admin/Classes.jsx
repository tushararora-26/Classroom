import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiLayers, FiUsers, FiUserCheck, FiArrowRight } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Modal,
  Input,
} from '../../components/ui';

const Classes = () => {
  const { data: classes, loading, error, reload } = useApi('/class/getall', {
    select: (d) => d.classes,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      await api.post('/class', { class: name });
      toast.success('Class created');
      setName('');
      setDialogOpen(false);
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
        title="Classes"
        description={classes ? `${classes.length} classes in this school` : null}
        action={
          <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
            New class
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-3 w-32" />
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={FiLayers}
            title="No classes yet"
            description="Create a class, then add teachers, subjects and students to it."
            action={
              <Button icon={FiPlus} onClick={() => setDialogOpen(true)}>
                New class
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <Link
              key={klass._id}
              to={`/admin/classes/${klass._id}`}
              className="group rounded-lg border border-line bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="truncate text-sm font-semibold text-ink">{klass.class}</h2>
                <FiArrowRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </div>

              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <FiUsers className="h-3.5 w-3.5" aria-hidden="true" />
                  <dt className="sr-only">Students</dt>
                  <dd>
                    <span className="font-medium tabular-nums text-ink">
                      {klass.students?.length || 0}
                    </span>{' '}
                    students
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiUserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <dt className="sr-only">Teachers</dt>
                  <dd>
                    <span className="font-medium tabular-nums text-ink">
                      {klass.teachers?.length || 0}
                    </span>{' '}
                    teachers
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiLayers className="h-3.5 w-3.5" aria-hidden="true" />
                  <dt className="sr-only">Subjects</dt>
                  <dd>
                    <span className="font-medium tabular-nums text-ink">
                      {klass.subjects?.length || 0}
                    </span>{' '}
                    subjects
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="New class"
        size="sm"
      >
        <form onSubmit={create} className="space-y-4" noValidate>
          <Input
            label="Class name"
            name="class"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Grade 10-A"
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
    </>
  );
};

export default Classes;
