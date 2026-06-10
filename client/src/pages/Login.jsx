import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { GoogleLogin } from '@react-oauth/google';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { loginUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [serverError, setServerError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const [rememberEmail, setRememberEmail] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberEmail(true);
    }
  }, [setValue]);

  // Handle key down to check CapsLock status
  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    
    // Remember email logic
    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', data.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const result = await loginUser(data.email, data.password);
    
    if (result.success) {
      toast.success("You're in.");
      if (result.user?.role === 'admin' && !location.state?.from) {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectTo);
      }
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Failed to sign in.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setServerError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    setGoogleLoading(false);
    
    if (result.success) {
      toast.success('Signed in via Google.');
      navigate(redirectTo);
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Google Sign-In failed.');
    }
  };

  const isLoading = isSubmitting || googleLoading;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/80 bg-surface-50/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-app-text">Sign in</h2>
          <p className="mt-2 text-sm text-app-text/60">
            Use your MensVibe account to save your bag and orders.
          </p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-error/10 p-4 text-xs font-semibold text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <div className={isLoading ? 'pointer-events-none opacity-50' : ''}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign-In failed.')}
              useOneTap
              theme="filled_black"
              shape="pill"
              width="320"
            />
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
            <span className="bg-surface-50 px-3 text-app-text/30">Or email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-app-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
              className={`w-full rounded-lg border bg-surface-50 px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                errors.email ? 'border-error focus:border-error' : 'border-surface-200 focus:border-brand-primary'
              }`}
              placeholder="demo@mensvibe.in"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-app-text">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoading}
                onKeyDown={handleKeyDown}
                {...register('password')}
                className={`w-full rounded-lg border bg-surface-50 pl-3 pr-10 py-2.5 text-sm focus:outline-none transition-colors ${
                  errors.password ? 'border-error focus:border-error' : 'border-surface-200 focus:border-brand-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text/40 hover:text-app-text"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}

            {/* Caps Lock Indicator */}
            {capsLockActive && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                Caps Lock is active!
              </p>
            )}
          </div>

          {/* Remember email check */}
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="h-4 w-4 rounded border-surface-200 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-xs text-app-text/70 font-medium">Remember my email</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-text py-3 text-sm font-semibold text-black hover:bg-app-text-hover disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-app-text/60">
          New here?{' '}
          <Link to="/register" className="font-semibold text-app-text hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
