import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  errorMessage,
} from '../lib/api';

const AuthContext = createContext(null);

export const HOME_FOR_ROLE = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
};

export const SIGNIN_FOR_ROLE = {
  admin: '/admin/signin',
  teacher: '/teacher/signin',
  student: '/student/signin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  // 'loading' until the stored token has been checked, so guards do not
  // bounce a signed-in user to the sign-in page on a page refresh.
  const [status, setStatus] = useState('loading');

  const clear = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setSchool(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSchool(null);
      setStatus('anonymous');
    });
  }, []);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setStatus('anonymous');
      return;
    }

    let cancelled = false;

    api
      .get('/me')
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.user);
        setSchool(data.school);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setStoredToken(null);
        setStatus('anonymous');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((data) => {
    setStoredToken(data.token);
    setUser(data.user);
    setSchool(data.school);
    setStatus('authenticated');
    return data;
  }, []);

  const signIn = useCallback(
    async (role, credentials) => {
      const path =
        role === 'admin'
          ? '/admin/signin'
          : role === 'teacher'
            ? '/teachers/signin'
            : '/students/signin';

      const { data } = await api.post(path, credentials);
      return applySession(data);
    },
    [applySession]
  );

  const registerAdmin = useCallback(
    async (payload) => {
      const { data } = await api.post('/admin/register', payload);
      return applySession(data);
    },
    [applySession]
  );

  const signUp = useCallback(
    async (role, payload) => {
      const path = role === 'teacher' ? '/teachers/signup' : '/students/signup';
      const { data } = await api.post(path, payload);
      return applySession(data);
    },
    [applySession]
  );

  const value = useMemo(
    () => ({
      user,
      school,
      status,
      role: user?.role || null,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      signIn,
      signUp,
      registerAdmin,
      signOut: clear,
      setUser,
      setSchool,
      errorMessage,
    }),
    [user, school, status, signIn, signUp, registerAdmin, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};
