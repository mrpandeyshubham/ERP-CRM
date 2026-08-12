import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-surface font-body-md text-body-md">
      <main className="flex-1 flex items-center justify-center p-md sm:p-lg relative overflow-hidden">
        {/* Background Pattern/Atmosphere */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, var(--color-inverse-primary) 0%, transparent 60%)' }}></div>
        
        <div className="w-full max-w-[440px] bg-surface-container-lowest border border-surface-variant rounded-lg p-xl relative z-10 shadow-[0px_4px_12px_rgba(27,38,59,0.08)]">
          {/* Header */}
          <div className="text-center mb-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-md">
              <span className="material-symbols-outlined text-on-primary text-2xl" data-weight="fill">grid_view</span>
            </div>
            <h1 className="font-headline-md text-[length:var(--text-headline-md)] leading-[var(--text-headline-md--line-height)] tracking-[var(--text-headline-md--letter-spacing)] font-[var(--text-headline-md--font-weight)] text-primary mb-xs">
              DISTRO CORE
            </h1>
            <p className="font-body-sm text-[length:var(--text-body-sm)] leading-[var(--text-body-sm--line-height)] font-[var(--text-body-sm--font-weight)] text-on-surface-variant">
              Admin Console Portal
            </p>
          </div>
          
          {/* Form */}
          <form className="space-y-md" onSubmit={handleLogin}>
            {error && <div className="text-error font-body-sm text-[length:var(--text-body-sm)] text-center bg-error-container p-2 rounded">{error}</div>}
            
            <div className="space-y-sm">
              <label className="block font-label-caps text-[length:var(--text-label-caps)] leading-[var(--text-label-caps--line-height)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-lg">mail</span>
                </div>
                <input
                  className="block w-full pl-lg pr-sm py-sm border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-[length:var(--text-body-md)] leading-[var(--text-body-md--line-height)] focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-colors"
                  id="email"
                  name="email"
                  placeholder="user@company.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <label className="block font-label-caps text-[length:var(--text-label-caps)] leading-[var(--text-label-caps--line-height)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface" htmlFor="password">
                  Password
                </label>
                <a className="font-body-sm text-[length:var(--text-body-sm)] text-secondary hover:text-primary transition-colors" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-lg">lock</span>
                </div>
                <input
                  className="block w-full pl-lg pr-sm py-sm border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-[length:var(--text-body-md)] leading-[var(--text-body-md--line-height)] focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-colors"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className="pt-sm">
              <button
                className="w-full flex justify-center py-sm px-md border border-transparent rounded bg-primary text-on-primary font-title-sm text-[length:var(--text-title-sm)] leading-[var(--text-title-sm--line-height)] font-[var(--text-title-sm--font-weight)] hover:bg-tertiary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors active:opacity-90"
                type="submit"
              >
                Sign In
              </button>
            </div>
          </form>
          
          {/* Footer Links */}
          <div className="mt-xl text-center border-t border-surface-variant pt-md">
            <p className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface-variant">
              Need system access?{' '}
              <a className="font-body-sm text-[length:var(--text-body-sm)] text-primary font-bold hover:underline transition-all" href="#">
                Request Access
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
