import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BACKEND_URL = 'https://farmconnect-eight.vercel.app/request-otp'; // Change to your deployed backend URL when ready

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

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-green-700">Forgot Password</h2>
        <p className="text-gray-600 mt-2">{step === 'email' && 'Enter your registered email to receive an OTP.'}
        {step === 'otp' && 'Enter the OTP sent to your email.'}
        {step === 'reset' && 'Enter your new password.'}</p>
      </div>
      {step === 'email' && (
        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 'otp' && (
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter OTP"
            value={enteredOtp}
            onChange={e => setEnteredOtp(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}
      {step === 'reset' && (
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="New password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword; 