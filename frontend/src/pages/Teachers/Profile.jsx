import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiSave } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Avatar,
  Badge,
  Button,
  Input,
  ErrorState,
  Skeleton,
} from '../../components/ui';

const TeacherProfile = () => {
  const { user, setUser, school } = useAuth();

  const { data: teacher, loading, error, reload } = useApi('/teachers/me', {
    select: (d) => d.teacher,
  });

  const [form, setForm] = useState({ name: '', password: '', currentPassword: '' });
  const [initialised, setInitialised] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (teacher && !initialised) {
    setForm({ name: teacher.name, password: '', currentPassword: '' });
    setInitialised(true);
  }

  const save = async (event) => {
    event.preventDefault();
    setFormError('');

    if (form.password && form.password.length < 8) {
      setFormError('New password must be at least 8 characters');
      return;
    }

    setBusy(true);

    try {
      const payload = { name: form.name };
      if (form.password) {
        payload.password = form.password;
        payload.currentPassword = form.currentPassword;
      }

      const { data } = await api.put('/teachers/me', payload);
      setUser({ ...user, name: data.teacher.name });
      setForm((current) => ({ ...current, password: '', currentPassword: '' }));
      toast.success('Profile updated');
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Profile" description="Your account and teaching assignments" />

      <Card>
        <CardHeader title="Account" />
        <CardBody>
          {loading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="flex items-center gap-4">
              <Avatar name={teacher.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{teacher.name}</p>
                <p className="truncate text-sm text-muted">{teacher.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="accent">{teacher.subject}</Badge>
                  <Badge>{school?.name}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="My classes" />
        {loading ? (
          <CardBody>
            <Skeleton className="h-4 w-40" />
          </CardBody>
        ) : teacher.classes?.length ? (
          <ul className="divide-y divide-line">
            {teacher.classes.map((klass) => (
              <li key={klass._id} className="px-5 py-3 text-sm text-ink">
                {klass.class}
              </li>
            ))}
          </ul>
        ) : (
          <CardBody>
            <p className="text-sm text-muted">
              You are not assigned to any class yet. Your administrator does that.
            </p>
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Update details"
          description="Leave the password blank to keep your current one"
        />
        <CardBody>
          <form onSubmit={save} className="max-w-sm space-y-4" noValidate>
            <Input
              label="Display name"
              name="name"
              value={form.name}
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
              required
            />
            <Input
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
              hint="Leave blank to keep your current password"
            />

            {form.password && (
              <Input
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((c) => ({ ...c, currentPassword: event.target.value }))
                }
                hint="Required to set a new password"
                required
              />
            )}

            {formError && (
              <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}

            <Button type="submit" icon={FiSave} loading={busy}>
              Save changes
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default TeacherProfile;
