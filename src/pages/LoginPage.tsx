import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser, findUser, findUserByEmail, setCurrentUser, genId, type User } from '@/lib/storage';
import { BookOpen, GraduationCap, Shield } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [form, setForm] = useState({ name: '', usn: '', adminId: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      if (!form.email || !form.password) return setError('Fill all required fields');
      if (role === 'student' && (!form.name || !form.usn)) return setError('Fill all required fields');
      if (role === 'admin' && !form.adminId) return setError('Fill all required fields');
      if (findUserByEmail(form.email)) return setError('Email already registered');

      const user: User = {
        id: genId(),
        name: role === 'admin' ? (form.adminId) : form.name,
        email: form.email,
        password: form.password,
        role,
        ...(role === 'student' ? { usn: form.usn } : { adminId: form.adminId }),
      };
      saveUser(user);
      showToast('Account created! Please login.');
      setIsSignup(false);
    } else {
      const user = findUser(form.email, form.password, role);
      if (!user) return setError('Invalid credentials');
      setCurrentUser(user);
      navigate(role === 'student' ? '/student' : '/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {toast && (
        <div className="fixed top-4 right-4 bg-success text-success-foreground px-5 py-3 rounded-lg shadow-lg toast-slide z-50">
          {toast}
        </div>
      )}
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Smart Learning Portal</h1>
          <p className="text-muted-foreground mt-2">Your gateway to knowledge & assessment</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          {/* Role Toggle */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === 'student' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === 'admin' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-4">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && role === 'student' && (
              <>
                <input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="USN (University Seat Number)"
                  value={form.usn}
                  onChange={e => setForm({ ...form, usn: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </>
            )}
            {isSignup && role === 'admin' && (
              <input
                placeholder="Admin ID"
                value={form.adminId}
                onChange={e => setForm({ ...form, adminId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="text-secondary font-medium hover:underline">
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
