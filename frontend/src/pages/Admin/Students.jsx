import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiUsers, FiSearch, FiTrash2, FiEdit2 } from 'react-icons/fi';
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

const emptyForm = { name: '', registrationNumber: '', password: '' };

const Students = () => {
  const { data: students, loading, error, reload } = useApi('/students/getall', {
    select: (d) => d.students,
  });

  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null); // { mode: 'create' | 'edit', student }
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        (s.class?.class || '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setDialog({ mode: 'create' });
  };

  const openEdit = (student) => {
    setForm({ name: student.name, registrationNumber: student.registrationNumber, password: '' });
    setFormError('');
    setDialog({ mode: 'edit', student });
  };

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      if (dialog.mode === 'create') {
        await api.post('/students', form);
        toast.success('Student added');
      } else {
        const payload = { name: form.name, registrationNumber: form.registrationNumber };
        if (form.password) payload.password = form.password;
        await api.put(`/students/${dialog.student._id}`, payload);
        toast.success('Student updated');
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
      await api.delete(`/students/${confirmDelete._id}`);
      toast.success('Student deleted');
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
        title="Students"
        description={students ? `${students.length} enrolled in this school` : null}
        action={
          <Button icon={FiPlus} onClick={openCreate}>
            Add student
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <FiSearch className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, registration number or class"
            aria-label="Search students"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={6} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title={query ? 'No matching students' : 'No students yet'}
            description={
              query
                ? 'Try a different search term.'
                : 'Add students, then enrol them into a class.'
            }
            action={
              !query && (
                <Button icon={FiPlus} onClick={openCreate}>
                  Add student
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Registration</Th>
                <Th>Class</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((student) => (
                <Tr key={student._id}>
                  <Td>
                    <Link
                      to={`/admin/students/${student._id}`}
                      className="flex items-center gap-2.5 font-medium hover:text-accent"
                    >
                      <Avatar name={student.name} size="sm" />
                      <span className="truncate">{student.name}</span>
                    </Link>
                  </Td>
                  <Td className="tabular-nums text-muted">{student.registrationNumber}</Td>
                  <Td>
                    {student.class ? (
                      <Badge tone="accent">{student.class.class}</Badge>
                    ) : (
                      <Badge>Unassigned</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FiEdit2}
                        onClick={() => openEdit(student)}
                        aria-label={`Edit ${student.name}`}
                      />
                      <Button
                        variant="dangerGhost"
                        size="sm"
                        icon={FiTrash2}
                        onClick={() => setConfirmDelete(student)}
                        aria-label={`Delete ${student.name}`}
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
        title={dialog?.mode === 'edit' ? 'Edit student' : 'Add student'}
        description={
          dialog?.mode === 'edit'
            ? 'Leave the password blank to keep the current one.'
            : 'The student signs in with their registration number and the school code.'
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Full name" name="name" value={form.name} onChange={onChange} required />
          <Input
            label="Registration number"
            name="registrationNumber"
            value={form.registrationNumber}
            onChange={onChange}
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
              {dialog?.mode === 'edit' ? 'Save changes' : 'Add student'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete student?"
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
          from their class, and their submissions and attendance entries will be deleted. This
          cannot be undone.
        </p>
      </Modal>
    </>
  );
};

export default Students;
