import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';

const AdminRegister = () => {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    schoolName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setBusy(true);

    try {
      const { school } = await registerAdmin({
        name: form.name,
        schoolName: form.schoolName,
        email: form.email,
        password: form.password,
      });

      toast.success(`School created — code ${school.code}`);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not register'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Register your school"
      description="You will get a school code that teachers and students use to join."
      footer={
        <>
          Already registered?{' '}
          <Link to="/admin/signin" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Your name" name="name" value={form.name} onChange={onChange} required />
        <Input
          label="School name"
          name="schoolName"
          value={form.schoolName}
          onChange={onChange}
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
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          hint="At least 8 characters"
          required
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={onChange}
          required
        />

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={busy} className="w-full">
          Create school
        </Button>
      </form>
    </AuthLayout>
  );
};

export default AdminRegister;
