import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiSave } from 'react-icons/fi';
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

const AdminProfile = () => {
  const { user, school, setUser, setSchool } = useAuth();

  const { data, loading, error, reload } = useApi('/admin/me');

  const [account, setAccount] = useState({
    name: '',
    email: '',
    password: '',
    currentPassword: '',
  });
  const [schoolName, setSchoolName] = useState('');
  const [initialised, setInitialised] = useState(false);

  const [accountError, setAccountError] = useState('');
  const [schoolError, setSchoolError] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);

  if (data && !initialised) {
    setAccount({ name: data.admin.name, email: data.admin.email, password: '', currentPassword: '' });
    setSchoolName(data.school.name);
    setInitialised(true);
  }

  const onAccountChange = (event) =>
    setAccount((current) => ({ ...current, [event.target.name]: event.target.value }));

  // Changing the login email or the password needs the current password; a
  // plain rename does not, so the field only appears when it is required.
  const needsCurrentPassword =
    Boolean(account.password) || (data && account.email !== data.admin.email);

  const saveAccount = async (event) => {
    event.preventDefault();
    setAccountError('');

    if (account.password && account.password.length < 8) {
      setAccountError('New password must be at least 8 characters');
      return;
    }

    setSavingAccount(true);

    try {
      const payload = { name: account.name, email: account.email };
      if (account.password) payload.password = account.password;
      if (needsCurrentPassword) payload.currentPassword = account.currentPassword;

      const { data: result } = await api.put('/admin/me', payload);

      setUser({ ...user, name: result.admin.name, email: result.admin.email });
      setAccount((current) => ({ ...current, password: '', currentPassword: '' }));
      toast.success('Profile updated');
      reload();
    } catch (err) {
      setAccountError(errorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const saveSchool = async (event) => {
    event.preventDefault();
    setSchoolError('');
    setSavingSchool(true);

    try {
      const { data: result } = await api.put('/admin/school', { name: schoolName });

      setSchool(result.school);
      toast.success('School updated');
      reload();
    } catch (err) {
      setSchoolError(errorMessage(err));
    } finally {
      setSavingSchool(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(school.code);
      toast.success('School code copied');
    } catch {
      toast.error('Could not copy — select it manually');
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Profile" description="Your account and school details" />

      <Card>
        <CardHeader title="Account" />
        <CardBody>
          {loading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="flex items-center gap-4">
              <Avatar name={data.admin.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{data.admin.name}</p>
                <p className="truncate text-sm text-muted">{data.admin.email}</p>
                <Badge tone="accent" className="mt-1.5">
                  Administrator
                </Badge>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Edit your details"
          description="Your email is how you sign in, so changing it asks for your password"
        />
        <CardBody>
          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <form onSubmit={saveAccount} className="max-w-sm space-y-4" noValidate>
              <Input
                label="Full name"
                name="name"
                value={account.name}
                onChange={onAccountChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={account.email}
                onChange={onAccountChange}
                required
              />
              <Input
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={account.password}
                onChange={onAccountChange}
                hint="Leave blank to keep your current password"
              />

              {needsCurrentPassword && (
                <Input
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={account.currentPassword}
                  onChange={onAccountChange}
                  hint="Required to change your email or password"
                  required
                />
              )}

              {accountError && (
                <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                  {accountError}
                </p>
              )}

              <Button type="submit" icon={FiSave} loading={savingAccount}>
                Save changes
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="School"
          description="Teachers and students need the join code to sign in"
        />
        <CardBody className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Join code</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded-md border border-line bg-ground px-2 py-1 font-mono text-sm tracking-widest text-ink">
                {school?.code}
              </code>
              <Button variant="ghost" size="sm" icon={FiCopy} onClick={copyCode}>
                Copy
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              The code cannot be changed — people already have it written down.
            </p>
          </div>

          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <form onSubmit={saveSchool} className="max-w-sm space-y-4" noValidate>
              <Input
                label="School name"
                name="schoolName"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                required
              />

              {schoolError && (
                <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                  {schoolError}
                </p>
              )}

              <Button type="submit" icon={FiSave} loading={savingSchool}>
                Rename school
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default AdminProfile;
