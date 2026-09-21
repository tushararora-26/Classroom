import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiUserCheck, FiSearch, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  EmptyState,
  ErrorState,
  SkeletonRows,
  Modal,
  Input,
} from '../../components/ui';

const emptyForm = { name: '', email: '', subject: '', password: '' };

const Teachers = () => {
  const { data: teachers, loading, error, reload } = useApi('/teachers/getall', {
    select: (d) => d.teachers,
  });

  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [teachers, query]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setDialog({ mode: 'create' });
  };

  const openEdit = (teacher) => {
    setForm({ name: teacher.name, email: teacher.email, subject: teacher.subject, password: '' });
    setFormError('');
    setDialog({ mode: 'edit', teacher });
  };

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      if (dialog.mode === 'create') {
        await api.post('/teachers', form);
        toast.success('Teacher added');
      } else {
        const payload = { name: form.name, email: form.email, subject: form.subject };
        if (form.password) payload.password = form.password;
        await api.put(`/teachers/${dialog.teacher._id}`, payload);
        toast.success('Teacher updated');
      }

      setDialog(null);
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
      await api.delete(`/teachers/${confirmDelete._id}`);
      toast.success('Teacher deleted');
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
        title="Teachers"
        description={teachers ? `${teachers.length} on staff` : null}
        action={
          <Button icon={FiPlus} onClick={openCreate}>
            Add teacher
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <FiSearch className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email or subject"
            aria-label="Search teachers"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FiUserCheck}
            title={query ? 'No matching teachers' : 'No teachers yet'}
            description={
              query ? 'Try a different search term.' : 'Add teachers, then assign them to classes.'
            }
            action={
              !query && (
                <Button icon={FiPlus} onClick={openCreate}>
                  Add teacher
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Subject</Th>
                <Th>Classes</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((teacher) => (
                <Tr key={teacher._id}>
                  <Td>
                    <div className="flex items-center gap-2.5 font-medium">
                      <Avatar name={teacher.name} size="sm" />
                      <span className="truncate">{teacher.name}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{teacher.email}</Td>
                  <Td>
                    <Badge tone="accent">{teacher.subject}</Badge>
                  </Td>
                  <Td className="text-muted">
                    {teacher.classes?.length
                      ? teacher.classes.map((c) => c.class).join(', ')
                      : '—'}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FiEdit2}
                        onClick={() => openEdit(teacher)}
                        aria-label={`Edit ${teacher.name}`}
                      />
                      <Button
                        variant="dangerGhost"
                        size="sm"
                        icon={FiTrash2}
                        onClick={() => setConfirmDelete(teacher)}
                        aria-label={`Delete ${teacher.name}`}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Edit teacher' : 'Add teacher'}
        description={
          dialog?.mode === 'edit'
            ? 'Leave the password blank to keep the current one.'
            : 'The teacher signs in with their email and the school code.'
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Full name" name="name" value={form.name} onChange={onChange} required />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
          <Input
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={onChange}
            placeholder="Mathematics"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            hint="At least 8 characters"
            required={dialog?.mode === 'create'}
          />

          {formError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {dialog?.mode === 'edit' ? 'Save changes' : 'Add teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete teacher?"
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
          <span className="font-medium text-ink">{confirmDelete?.name}</span> will be removed
          from every class and from any subject they teach. This cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default Teachers;
