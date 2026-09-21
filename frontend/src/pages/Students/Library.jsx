import { useState } from 'react';
import axios from 'axios';
import { FiBookOpen, FiSearch, FiExternalLink } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';
import {
  PageHeader,
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  SkeletonRows,
} from '../../components/ui';

const TABS = [
  { key: 'school', label: 'School library' },
  { key: 'google', label: 'Search Google Books' },
];

const SchoolLibrary = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi(
    `/library/getall?search=${encodeURIComponent(search)}&page=${page}&limit=20`,
    { deps: [search, page] }
  );

  const books = data?.books || [];
  const pagination = data?.pagination;

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <FiSearch className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search your school's catalogue"
          aria-label="Search the school library"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <SkeletonRows rows={6} cols={3} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={FiBookOpen}
          title={search ? 'No matching books' : 'The catalogue is empty'}
          description={
            search
              ? 'Try a different title or author.'
              : 'Your school has not added any books yet.'
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Author</Th>
                <Th>Availability</Th>
              </Tr>
            </Thead>
            <Tbody>
              {books.map((book) => (
                <Tr key={book._id}>
                  <Td className="font-medium">{book.bookname}</Td>
                  <Td className="text-muted">{book.author}</Td>
                  <Td>
                    <Badge tone={book.available > 0 ? 'success' : 'danger'}>
                      {book.available > 0 ? `${book.available} available` : 'All on loan'}
                    </Badge>
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
  );
};

const GoogleBooks = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (event) => {
    event.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Google Books is public, so this call deliberately bypasses the app's
      // own axios instance and its Authorization header.
      const { data } = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: { q: query, maxResults: 20 },
      });

      setResults(data.items || []);
    } catch {
      setError('Could not reach Google Books. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={search} className="flex items-center gap-2 border-b border-line px-4 py-3">
        <FiSearch className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search millions of titles"
          aria-label="Search Google Books"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
        />
        <Button type="submit" size="sm" loading={loading}>
          Search
        </Button>
      </form>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <SkeletonRows rows={5} cols={2} />
      ) : results === null ? (
        <EmptyState
          icon={FiSearch}
          title="Search Google Books"
          description="Look up a title or author to read more about it."
        />
      ) : results.length === 0 ? (
        <EmptyState icon={FiBookOpen} title="No results" description="Try different words." />
      ) : (
        <ul className="divide-y divide-line">
          {results.map((item) => {
            const info = item.volumeInfo || {};
            const thumb = info.imageLinks?.thumbnail?.replace('http://', 'https://');

            return (
              <li key={item.id} className="flex gap-4 px-5 py-4">
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    className="h-20 w-14 shrink-0 rounded border border-line object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded border border-line bg-ground text-muted">
                    <FiBookOpen className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{info.title}</p>
                  {info.authors && (
                    <p className="mt-0.5 text-xs text-muted">{info.authors.join(', ')}</p>
                  )}
                  {info.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{info.description}</p>
                  )}
                  {info.previewLink && (
                    <a
                      href={info.previewLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      Preview
                      <FiExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

const StudentLibrary = () => {
  const [tab, setTab] = useState('school');

  return (
    <>
      <PageHeader title="Library" description="Your school's catalogue, plus the wider web" />

      <div
        role="tablist"
        aria-label="Library source"
        className="inline-flex rounded-md border border-line bg-surface p-0.5"
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-accent text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'school' ? <SchoolLibrary /> : <GoogleBooks />}
    </>
  );
};

export default StudentLibrary;
