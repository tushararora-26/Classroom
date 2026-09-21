import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX, FiSave, FiUsers, FiClock } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import { api, errorMessage } from '../../lib/api';
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
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
  Input,
} from '../../components/ui';
import { formatDate, toDateInput } from '../../lib/format';

const TeacherClassDetails = () => {
  const { classId } = useParams();

  const { data: klass, loading, error, reload } = useApi(`/teachers/me/classes/${classId}`, {
    select: (d) => d.class,
    deps: [classId],
  });

  const {
    data: history,
    loading: historyLoading,
    reload: reloadHistory,
  } = useApi(`/teachers/me/classes/${classId}/all-attendance`, {
    select: (d) => d.attendanceRecords,
    deps: [classId],
  });

  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  // Default everyone to present, then overlay whatever is already recorded for
  // the chosen date so editing a past register starts from the real values.
  useEffect(() => {
    if (!klass) return;

    const existing = (history || []).find(
      (record) => toDateInput(record.date) === date
    );

    const next = {};
    klass.students.forEach((student) => {
      const recorded = existing?.attendanceRecords.find(
        (r) => (r.student?._id || r.student) === student._id
      );
      next[student._id] = recorded ? recorded.present : true;
    });

    setMarks(next);
  }, [klass, history, date]);

  const summary = useMemo(() => {
    const values = Object.values(marks);
    return {
      present: values.filter(Boolean).length,
      absent: values.filter((value) => value === false).length,
    };
  }, [marks]);

  const save = async () => {
    setSaving(true);

    try {
      await api.post(`/teachers/me/classes/${classId}/attendance`, { date, attendance: marks });
      toast.success('Attendance saved');
      reloadHistory();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setAll = (present) =>
    setMarks(Object.fromEntries(Object.keys(marks).map((id) => [id, present])));

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (loading) {
    return (
      <>
        <Skeleton className="h-7 w-48" />
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        to="/teacher/classes"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <FiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        My classes
      </Link>

      <PageHeader
        title={klass.class}
        description={`${klass.students.length} students`}
        action={
          <Link
            to={`/teacher/assignments?class=${classId}`}
            className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-ground"
          >
            Assignments
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="Take attendance"
          description="Everyone starts marked present; tap to switch"
          action={
            <Button icon={FiSave} loading={saving} onClick={save} disabled={klass.students.length === 0}>
              Save
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <Input
                label="Date"
                name="date"
                type="date"
                value={date}
                max={toDateInput(new Date())}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setAll(true)}>
                All present
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAll(false)}>
                All absent
              </Button>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge tone="success">{summary.present} present</Badge>
              <Badge tone="danger">{summary.absent} absent</Badge>
            </div>
          </div>

          {klass.students.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="No students in this class"
              description="Your administrator enrols students into classes."
            />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {klass.students.map((student) => {
                const present = marks[student._id] ?? true;

                return (
                  <li
                    key={student._id}
                    className="flex items-center justify-between gap-4 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={student.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{student.name}</p>
                        <p className="text-xs tabular-nums text-muted">
                          {student.registrationNumber}
                        </p>
                      </div>
                    </div>

                    <div
                      role="group"
                      aria-label={`Attendance for ${student.name}`}
                      className="flex overflow-hidden rounded-md border border-line"
                    >
                      <button
                        type="button"
                        aria-pressed={present}
                        onClick={() => setMarks((m) => ({ ...m, [student._id]: true }))}
                        className={`flex h-8 w-9 items-center justify-center transition-colors ${
                          present
                            ? 'bg-success text-white'
                            : 'bg-surface text-muted hover:bg-ground'
                        }`}
                      >
                        <FiCheck className="h-4 w-4" />
                        <span className="sr-only">Present</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={!present}
                        onClick={() => setMarks((m) => ({ ...m, [student._id]: false }))}
                        className={`flex h-8 w-9 items-center justify-center border-l border-line transition-colors ${
                          !present
                            ? 'bg-danger text-white'
                            : 'bg-surface text-muted hover:bg-ground'
                        }`}
                      >
                        <FiX className="h-4 w-4" />
                        <span className="sr-only">Absent</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Attendance history" />
        {historyLoading ? (
          <CardBody>
            <Skeleton className="h-4 w-40" />
          </CardBody>
        ) : !history || history.length === 0 ? (
          <EmptyState
            icon={FiClock}
            title="Nothing recorded yet"
            description="Saved registers appear here, most recent first."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Present</Th>
                <Th>Absent</Th>
                <Th>Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.map((record) => {
                const present = record.attendanceRecords.filter((r) => r.present).length;
                const total = record.attendanceRecords.length;
                const rate = total === 0 ? 0 : Math.round((present / total) * 100);

                return (
                  <Tr
                    key={record._id}
                    className="cursor-pointer"
                    onClick={() => setDate(toDateInput(record.date))}
                  >
                    <Td className="font-medium">{formatDate(record.date)}</Td>
                    <Td className="tabular-nums text-success">{present}</Td>
                    <Td className="tabular-nums text-danger">{total - present}</Td>
                    <Td>
                      <Badge tone={rate >= 90 ? 'success' : rate >= 75 ? 'warning' : 'danger'}>
                        {rate}%
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </>
  );
};

export default TeacherClassDetails;
