import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { SEO } from '../components/SEO.jsx';

const resetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
      'Must include uppercase, lowercase, number, and special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const ResetPassword = () => {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    const result = await resetPassword(token, data.password);
    if (result.success) {
      toast.success('Password reset successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a3e635', '#ffffff', '#000000'] });
      setTimeout(() => navigate('/'), 1500);
    } else {
      setServerError(result.error);
      toast.error(result.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/auth-bg.png')" }}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-8 shadow-2xl backdrop-blur-md relative z-10">
        <SEO title="Reset Password" description="Set a new password for your MensVibe account." noindex />
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Set new password</h2>
          <p className="mt-2 text-sm text-white/60">Must be at least 8 characters with uppercase, lowercase, number, and special character.</p>
        </div>

        {serverError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-error/10 p-4 text-xs font-semibold text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('password')}
                className={`w-full rounded-xl border bg-white/5 pl-4 pr-12 py-3 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:outline-none transition-all ${errors.password ? 'border-error focus:border-error' : 'border-white/10 focus:border-white/30'}`}
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('confirmPassword')}
                className={`w-full rounded-xl border bg-white/5 pl-4 pr-12 py-3 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:outline-none transition-all ${errors.confirmPassword ? 'border-error focus:border-error' : 'border-white/10 focus:border-white/30'}`}
                placeholder="Confirm new password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}
          </button>
        </form>

        <Link to="/login" className="mt-6 block text-center text-sm text-white/60 hover:text-white transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};