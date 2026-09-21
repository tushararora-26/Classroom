import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiBookOpen, FiSearch, FiTrash2, FiEdit2 } from 'react-icons/fi';
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
  EmptyState,
  ErrorState,
  SkeletonRows,
  Modal,
  Input,
} from '../../components/ui';

const emptyForm = { bookname: '', author: '', isbn: '', copies: 1 };

const Library = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi(
    `/library/getall?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
    { deps: [search, page] }
  );

  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const books = data?.books || [];
  const pagination = data?.pagination;

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setDialog({ mode: 'create' });
  };

  const openEdit = (book) => {
    setForm({
      bookname: book.bookname,
      author: book.author,
      isbn: book.isbn || '',
      copies: book.copies,
      available: book.available,
    });
    setFormError('');
    setDialog({ mode: 'edit', book });
  };

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      if (dialog.mode === 'create') {
        await api.post('/library', form);
        toast.success('Book added');
      } else {
        await api.put(`/library/${dialog.book._id}`, form);
        toast.success('Book updated');
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
      await api.delete(`/library/${confirmDelete._id}`);
      toast.success('Book removed');
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
        title="Library"
        description={pagination ? `${pagination.total} titles in the catalogue` : null}
        action={
          <Button icon={FiPlus} onClick={openCreate}>
            Add book
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <FiSearch className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title, author or ISBN"
            aria-label="Search the library"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <SkeletonRows rows={6} cols={4} />
        ) : books.length === 0 ? (
          <EmptyState
            icon={FiBookOpen}
            title={search ? 'No matching books' : 'The catalogue is empty'}
            description={
              search ? 'Try a different search term.' : 'Add the books your school holds.'
            }
            action={
              !search && (
                <Button icon={FiPlus} onClick={openCreate}>
                  Add book
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Author</Th>
                  <Th>ISBN</Th>
                  <Th>Availability</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {books.map((book) => (
                  <Tr key={book._id}>
                    <Td className="font-medium">{book.bookname}</Td>
                    <Td className="text-muted">{book.author}</Td>
                    <Td className="tabular-nums text-muted">{book.isbn || '—'}</Td>
                    <Td>
                      <Badge tone={book.available > 0 ? 'success' : 'danger'}>
                        {book.available} of {book.copies}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FiEdit2}
                          onClick={() => openEdit(book)}
                          aria-label={`Edit ${book.bookname}`}
                        />
                        <Button
                          variant="dangerGhost"
                          size="sm"
                          icon={FiTrash2}
                          onClick={() => setConfirmDelete(book)}
                          aria-label={`Delete ${book.bookname}`}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-4 py-3">
                <p className="text-xs text-muted">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Edit book' : 'Add book'}
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Title" name="bookname" value={form.bookname} onChange={onChange} required />
          <Input label="Author" name="author" value={form.author} onChange={onChange} required />
          <Input label="ISBN" name="isbn" value={form.isbn} onChange={onChange} />
          <Input
            label="Total copies"
            name="copies"
            type="number"
            min="0"
            value={form.copies}
            onChange={onChange}
            required
          />
          {dialog?.mode === 'edit' && (
            <Input
              label="Available now"
              name="available"
              type="number"
              min="0"
              value={form.available}
              onChange={onChange}
              hint="Cannot exceed total copies"
              required
            />
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
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove book?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{confirmDelete?.bookname}</span> will be removed
          from the catalogue.
        </p>
      </Modal>
    </>
  );
};

export default Library;
