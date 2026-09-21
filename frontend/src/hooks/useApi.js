import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../lib/api';

/**
 * Fetches one endpoint and exposes the three states every list view needs:
 * loading, error and data. `select` pulls the useful field out of the
 * envelope the API returns, so callers do not repeat `data.students`.
 */
export const useApi = (url, { select = (d) => d, skip = false, deps = [] } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!skip);

  const load = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(url);
      setData(select(response.data));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
    // `select` is intentionally excluded: callers pass an inline arrow, which
    // would change identity on every render and re-fetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
};

/** Runs several requests together, for dashboards that need many counts. */
export const useApiAll = (requests, { skip = false, deps = [] } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!skip);

  const load = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const entries = Object.entries(requests);
      const responses = await Promise.all(entries.map(([, url]) => api.get(url)));

      setData(
        Object.fromEntries(entries.map(([key], index) => [key, responses[index].data]))
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
};
