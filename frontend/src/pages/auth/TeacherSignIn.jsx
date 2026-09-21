import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';

const TeacherSignIn = () => {
  const { signIn, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', schoolCode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated && role === 'teacher') return <Navigate to="/teacher" replace />;

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await signIn('teacher', form);
      toast.success('Signed in');
      navigate('/teacher', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Teacher sign in"
      description="Your classes, attendance and assignments."
      footer={
        <>
          New here?{' '}
          <Link to="/teacher/signup" className="font-medium text-accent hover:underline">
            Join with a school code
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="School code"
          name="schoolCode"
          value={form.schoolCode}
          onChange={onChange}
          hint="Ask your administrator if you do not have it"
          className="uppercase"
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          required
        />

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={busy} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        <Link to="/choose" className="text-accent hover:underline">
          Pick a different role
        </Link>
      </p>
    </AuthLayout>
  );
};

export default TeacherSignIn;
