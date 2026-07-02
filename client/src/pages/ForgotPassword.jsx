import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SEO } from '../components/SEO.jsx';

const forgotSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address').toLowerCase(),
});

export const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [serverError, setServerError] = useState('');
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    const result = await forgotPassword(data.email);
    if (result.success) {
      setSent(true);
      toast.success('Reset link sent if email is registered.');
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Something went wrong.');
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/auth-bg.png')" }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-8 shadow-2xl backdrop-blur-md relative z-10 text-center">
          <SEO title="Check Your Email" description="Password reset email sent." noindex />
          <MailCheck className="mx-auto h-12 w-12 text-brand-primary mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-white/60 mb-6">
            If that email is registered, we've sent a password reset link.
          </p>
          <Link to="/login" className="text-sm font-semibold text-white hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/auth-bg.png')" }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-8 shadow-2xl backdrop-blur-md relative z-10">
        <SEO title="Forgot Password" description="Reset your MensVibe password." noindex />
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Forgot password</h2>
          <p className="mt-2 text-sm text-white/60">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-error/10 p-4 text-xs font-semibold text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email')}
              className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:outline-none transition-all ${errors.email ? 'border-error focus:border-error' : 'border-white/10 focus:border-white/30'}`}

            />
            {errors.email && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
          </button>
        </form>

        <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};