import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiUsers, FiUserCheck, FiBookOpen, FiEdit2 } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
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
  Skeleton,
  Modal,
  Input,
  Select,
} from '../../components/ui';

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const { data: klass, loading, error, reload, setData } = useApi(`/class/${classId}`, {
    select: (d) => d.class,
    deps: [classId],
  });

  const { data: allTeachers } = useApi('/teachers/getall', { select: (d) => d.teachers });

  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const open = (mode, initial = {}) => {
    setForm(initial);
    setFormError('');
    setDialog(mode);
  };

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      if (dialog === 'rename') {
        const { data } = await api.put(`/class/${classId}`, { class: form.class });
        setData(data.class);
        toast.success('Class renamed');
      } else if (dialog === 'student') {
        const { data } = await api.post(`/class/${classId}/students`, {
          registrationNumber: form.registrationNumber,
        });
        setData(data.class);
        toast.success('Student enrolled');
      } else if (dialog === 'teacher') {
        const { data } = await api.post(`/class/${classId}/teachers`, {
          teacherId: form.teacherId,
        });
        setData(data.class);
        toast.success('Teacher assigned');
      } else if (dialog === 'subject') {
        const { data } = await api.post(`/class/${classId}/subjects`, {
          name: form.name,
          teacherId: form.teacherId,
        });
        setData(data.class);
        toast.success('Subject added');
      }

      setDialog(null);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);

    try {
      if (confirm.kind === 'deleteClass') {
        await api.delete(`/class/${classId}`);
        toast.success('Class deleted');
        navigate('/admin/classes', { replace: true });
        return;
      }

      const paths = {
        student: `/class/${classId}/students/${confirm.id}`,
        teacher: `/class/${classId}/teachers/${confirm.id}`,
        subject: `/class/${classId}/subjects/${confirm.id}`,
      };

      const { data } = await api.delete(paths[confirm.kind]);
      setData(data.class || data.classDetails);
      toast.success('Removed');
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (loading) {
    return (
      <>
        <Skeleton className="h-7 w-48" />
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={klass.class}
        description={`${klass.students.length} students · ${klass.teachers.length} teachers · ${klass.subjects.length} subjects`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={FiEdit2}
              onClick={() => open('rename', { class: klass.class })}
            >
              Rename
            </Button>
            <Button
              variant="danger"
              icon={FiTrash2}
              onClick={() => setConfirm({ kind: 'deleteClass' })}
            >
              Delete
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader
          title="Students"
          description="Enrol an existing student by their registration number"
          action={
            <Button size="sm" icon={FiPlus} onClick={() => open('student', { registrationNumber: '' })}>
              Enrol
            </Button>
          }
        />
        {klass.students.length === 0 ? (
          <EmptyState icon={FiUsers} title="No students enrolled" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Registration</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {klass.students.map((student) => (
                <Tr key={student._id}>
                  <Td>
                    <div className="flex items-center gap-2.5 font-medium">
                      <Avatar name={student.name} size="sm" />
                      <span className="truncate">{student.name}</span>
                    </div>
                  </Td>
                  <Td className="tabular-nums text-muted">{student.registrationNumber}</Td>
                  <Td className="text-right">
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      icon={FiTrash2}
                      aria-label={`Remove ${student.name}`}
                      onClick={() => setConfirm({ kind: 'student', id: student._id, name: student.name })}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Teachers"
          action={
            <Button size="sm" icon={FiPlus} onClick={() => open('teacher', { teacherId: '' })}>
              Assign
            </Button>
          }
        />
        {klass.teachers.length === 0 ? (
          <EmptyState icon={FiUserCheck} title="No teachers assigned" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Subject</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {klass.teachers.map((teacher) => (
                <Tr key={teacher._id}>
                  <Td>
                    <div className="flex items-center gap-2.5 font-medium">
                      <Avatar name={teacher.name} size="sm" />
                      <span className="truncate">{teacher.name}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{teacher.email}</Td>
                  <Td>{teacher.subject && <Badge tone="accent">{teacher.subject}</Badge>}</Td>
                  <Td className="text-right">
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      icon={FiTrash2}
                      aria-label={`Remove ${teacher.name}`}
                      onClick={() => setConfirm({ kind: 'teacher', id: teacher._id, name: teacher.name })}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Subjects"
          description="Each subject is taught by one of the school's teachers"
          action={
            <Button size="sm" icon={FiPlus} onClick={() => open('subject', { name: '', teacherId: '' })}>
              Add subject
            </Button>
          }
        />
        {klass.subjects.length === 0 ? (
          <EmptyState icon={FiBookOpen} title="No subjects yet" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Subject</Th>
                <Th>Taught by</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {klass.subjects.map((subject) => (
                <Tr key={subject._id}>
                  <Td className="font-medium">{subject.name}</Td>
                  <Td className="text-muted">{subject.teacher?.name || '—'}</Td>
                  <Td className="text-right">
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      icon={FiTrash2}
                      aria-label={`Remove ${subject.name}`}
                      onClick={() => setConfirm({ kind: 'subject', id: subject._id, name: subject.name })}
                    />
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
        size="sm"
        title={
          {
            rename: 'Rename class',
            student: 'Enrol a student',
            teacher: 'Assign a teacher',
            subject: 'Add a subject',
          }[dialog] || ''
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {dialog === 'rename' && (
            <Input label="Class name" name="class" value={form.class || ''} onChange={onChange} required />
          )}

          {dialog === 'student' && (
            <Input
              label="Registration number"
              name="registrationNumber"
              value={form.registrationNumber || ''}
              onChange={onChange}
              hint="The student must already exist in this school"
              required
            />
          )}

          {(dialog === 'teacher' || dialog === 'subject') && (
            <>
              {dialog === 'subject' && (
                <Input
                  label="Subject name"
                  name="name"
                  value={form.name || ''}
                  onChange={onChange}
                  placeholder="Mathematics"
                  required
                />
              )}
              <Select
                label="Teacher"
                name="teacherId"
                value={form.teacherId || ''}
                onChange={onChange}
                required
              >
                <option value="">Select a teacher…</option>
                {(allTeachers || []).map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} — {teacher.subject}
                  </option>
                ))}
              </Select>
            </>
          )}

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
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.kind === 'deleteClass' ? 'Delete this class?' : 'Remove from class?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={runConfirm}>
              {confirm?.kind === 'deleteClass' ? 'Delete class' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {confirm?.kind === 'deleteClass' ? (
            <>
              <span className="font-medium text-ink">{klass.class}</span> will be deleted, along
              with its attendance records, assignments and notices. Students and teachers keep
              their accounts but are unassigned from it.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{confirm?.name}</span> will be removed from{' '}
              {klass.class}. The account itself is not deleted.
            </>
          )}
        </p>
      </Modal>
    </>
  );
};

export default ClassDetails;
