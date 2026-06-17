import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { GoogleLogin } from '@react-oauth/google';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const Register = () => {
  const { registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [serverError, setServerError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const passwordValue = useWatch({
    control,
    name: 'password',
    defaultValue: ''
  });

  // Calculate password strength score (0 to 4)
  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const strengthScore = calculatePasswordStrength(passwordValue);

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return 'None';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'None';
    }
  };

  const getStrengthColor = (score) => {
    switch (score) {
      case 1: return 'bg-error';
      case 2: return 'bg-amber-500';
      case 3: return 'bg-yellow-400';
      case 4: return 'bg-emerald-500';
      default: return 'bg-transparent';
    }
  };

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
    const result = await registerUser(data.name, data.email, data.password);

    if (result.success) {
      toast.success('Account ready — happy shopping.');
      navigate('/');
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Registration failed.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setServerError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    setGoogleLoading(false);

    if (result.success) {
      toast.success('Signed in via Google.');
      navigate('/');
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Google Sign-In failed.');
    }
  };

  const isLoading = isSubmitting || googleLoading;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/auth-bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-8 shadow-2xl backdrop-blur-md relative z-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Create account</h2>
          <p className="mt-2 text-sm text-white/60">
            Takes a minute. Then you can checkout and track orders.
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



        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isLoading}
              {...register('name')}
              className={`w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-500 backdrop-blur-md focus:outline-none transition-all ${errors.name ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-white/10 focus:border-white/30 focus:bg-black/60'
                }`}
              placeholder="Priya Sharma"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
              className={`w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-500 backdrop-blur-md focus:outline-none transition-all ${errors.email ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-white/10 focus:border-white/30 focus:bg-black/60'
                }`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isLoading}
                onKeyDown={handleKeyDown}
                {...register('password')}
                className={`w-full rounded-xl border bg-black/40 pl-4 pr-12 py-3 text-sm text-zinc-300 placeholder-zinc-500 backdrop-blur-md focus:outline-none transition-all ${errors.password ? 'border-error focus:border-error focus:ring-1 focus:ring-error' : 'border-white/10 focus:border-white/30 focus:bg-black/60'
                  }`}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all focus:outline-none z-10"
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

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const suggested = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase() + '!';
                  setValue('password', suggested, { shouldValidate: true, shouldDirty: true });
                  toast.success(`Suggested password applied & copied!`, { duration: 3000 });
                  navigator.clipboard.writeText(suggested);
                  setShowPassword(true); // Show the password so they can see what it is
                }}
                className="text-[10px] font-bold text-brand-primary uppercase tracking-wider hover:underline"
              >
                Suggest Password
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-white/60">
                  <span>Strength: {getStrengthLabel(strengthScore)}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(strengthScore)}`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Caps Lock Indicator */}
            {capsLockActive && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                Caps Lock is active!
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-text py-3 text-sm font-semibold text-black hover:bg-app-text-hover disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
