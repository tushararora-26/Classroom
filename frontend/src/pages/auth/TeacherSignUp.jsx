import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';

const TeacherSignUp = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    schoolCode: '',
    name: '',
    email: '',
    subject: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setBusy(true);

    try {
      await signUp('teacher', form);
      toast.success('Account created');
      navigate('/teacher', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Join as a teacher"
      description="You need your school's code to sign up."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/teacher/signin" className="font-medium text-accent hover:underline">
            Sign in
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
          className="uppercase"
          required
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          hint="At least 8 characters"
          required
        />

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={busy} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default TeacherSignUp;
