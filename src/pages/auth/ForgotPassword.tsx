import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Step 1: Submit email, request OTP from backend
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`OTP sent to ${email}`);
        setStep('otp');
      } else {
        toast.error(data.error || 'Failed to send OTP.');
      }
    } catch {
      toast.error('Failed to send OTP.');
    }
    setIsLoading(false);
  };

  // Step 2: Verify OTP with backend
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('reset');
        toast.success('OTP verified. Set your new password.');
      } else {
        toast.error(data.error || 'Invalid OTP.');
      }
    } catch {
      toast.error('Failed to verify OTP.');
    }
    setIsLoading(false);
  };

  // Step 3: Reset password via backend
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated! You can now log in.');
        setIsLoading(false);
        navigate('/login');
      } else {
        toast.error(data.error || 'Failed to update password.');
        setIsLoading(false);
      }
    } catch {
      toast.error('Failed to update password.');
      setIsLoading(false);
    }
  };

  // Same input and button styles as the login and register pages
  const inputClass = 'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300 disabled:opacity-50';
  const labelClass = 'block text-sm font-semibold text-gray-300';
  const buttonClass = 'w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-sm transition-all duration-300 shadow-lg active:scale-[0.98] disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed';
  const stepNumber = step === 'email' ? 1 : step === 'otp' ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020d06] via-[#071d10] to-[#010804] text-white px-4 py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
        <div className="mb-8">
          <div className="w-11 h-11 mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center">
            <KeyRound size={20} aria-hidden="true" className="text-yellow-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Step {stepNumber} of 3</p>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Reset your password</h1>
          <p className="text-gray-400 text-sm">
            {step === 'email' && 'Enter the email you registered with and we will send you a 6-digit code.'}
            {step === 'otp' && <>Enter the 6-digit code we sent to <span className="text-white font-semibold">{email}</span>.</>}
            {step === 'reset' && 'Choose a new password for your account.'}
          </p>
        </div>

        {step === 'email' && (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div className="space-y-1">
              <label htmlFor="reset-email" className={labelClass}>Email address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className={buttonClass} disabled={isLoading || !email}>
              {isLoading ? 'Sending code…' : 'Send code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="space-y-4" onSubmit={handleOtpSubmit}>
            <div className="space-y-1">
              <label htmlFor="reset-otp" className={labelClass}>Verification code</label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={`${inputClass} tracking-[0.5em] text-center text-lg font-bold`}
                placeholder="••••••"
                value={enteredOtp}
                onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className={buttonClass} disabled={isLoading || enteredOtp.length !== 6}>
              {isLoading ? 'Verifying…' : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setEnteredOtp(''); }}
              className="w-full text-sm text-gray-400 hover:text-white font-semibold transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form className="space-y-4" onSubmit={handleResetSubmit}>
            <div className="space-y-1">
              <label htmlFor="reset-new-password" className={labelClass}>New password</label>
              <input
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                className={inputClass}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="reset-confirm-password" className={labelClass}>Confirm new password</label>
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="Type it again"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 pt-1">Passwords do not match.</p>
              )}
            </div>
            <button type="submit" className={buttonClass} disabled={isLoading || !newPassword || newPassword !== confirmPassword}>
              {isLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          Remembered it?{' '}
          <Link to="/login" className="font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword; 