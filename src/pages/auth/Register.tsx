// TODO: Ensure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set to your Supabase project credentials.
// Also, check Supabase Auth settings for email confirmation requirements.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
// @ts-expect-error: No type definitions for react-google-recaptcha
import ReCAPTCHA from 'react-google-recaptcha';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import ThemeLoader from '../../components/ThemeLoader';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'farmer' | 'retailer'>('farmer');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [retypePassword, setRetypePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [retypeError, setRetypeError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  const register = useAppStore(state => state.register);
  const loginWithGoogle = useAppStore(state => state.loginWithGoogle);
  const loginWithFacebook = useAppStore(state => state.loginWithFacebook);
  const navigate = useNavigate();

  // Password validation function
  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one capital letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character.';
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
    if (retypePassword && e.target.value !== retypePassword) {
      setRetypeError('Passwords do not match.');
    } else {
      setRetypeError('');
    }
  };

  const handleRetypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRetypePassword(e.target.value);
    if (password !== e.target.value) {
      setRetypeError('Passwords do not match.');
    } else {
      setRetypeError('');
    }
  };

  const isFormInvalid =
    !!passwordError ||
    !!retypeError ||
    !password ||
    !retypePassword ||
    password !== retypePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast.error('Please verify that you are not a robot.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await register(email, password, name, role);
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error && typeof (error as unknown as { message?: string }).message === 'string'
          ? (error as unknown as { message: string }).message
          : JSON.stringify(error) || 'Failed to register';
        toast.error(errorMsg);
      } else {
        // Redirect based on role
        const dashboardPath = role === 'farmer' 
          ? '/farmer/dashboard' 
          : '/retailer/dashboard';
        toast.success('Registration successful!');
        navigate(dashboardPath);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    const { error } = await loginWithGoogle();
    setIsLoading(false);
    if (error) {
      toast.error('Google sign-in failed.');
    } else {
      toast.success('Signed in with Google!');
      navigate('/retailer/dashboard');
    }
  };

  const handleFacebookRegister = async () => {
    setIsLoading(true);
    const { error } = await loginWithFacebook();
    setIsLoading(false);
    if (error) {
      toast.error('Facebook sign-in failed.');
    } else {
      toast.success('Signed in with Facebook!');
      navigate('/retailer/dashboard');
    }
  };

  // Password requirements for checklist
  const passwordChecks = [
    {
      label: 'At least 6 characters',
      valid: password.length >= 6,
    },
    {
      label: 'At least one capital letter',
      valid: /[A-Z]/.test(password),
    },
    {
      label: 'At least one number',
      valid: /[0-9]/.test(password),
    },
    {
      label: 'At least one special character',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <ThemeLoader />
        </div>
      )}
      <div className={`max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md transition-all duration-300 ${isLoading ? 'blur-sm pointer-events-none select-none opacity-60' : ''}`}>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-green-700">Create your account</h2>
        <div className="flex flex-col gap-3 w-full mb-1">
          <button
            type="button"
            className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={handleGoogleRegister}
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 text-xl" /> Continue with Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={handleFacebookRegister}
            disabled={isLoading}
          >
            <FaFacebook className="mr-2 text-xl text-blue-600" /> Continue with Facebook
          </button>
        </div>
        <div className="flex items-center w-full my-3">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 font-medium">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              {passwordFocused && (
                <>
                  {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
                  <ul className="text-xs mt-2 space-y-1">
                    {passwordChecks.map((check, idx) => (
                      <li key={idx} className={check.valid ? 'text-green-600 flex items-center' : 'text-gray-500 flex items-center'}>
                        <span className="inline-block w-4">{check.valid ? '✓' : '•'}</span> {check.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div>
              <label htmlFor="retype-password" className="sr-only">Retype Password</label>
              <input
                id="retype-password"
                name="retype-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Retype Password"
                value={retypePassword}
                onChange={handleRetypeChange}
                disabled={isLoading}
              />
              {retypeError && <p className="text-xs text-red-600 mt-1">{retypeError}</p>}
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-green-700 mb-1">Select your role</label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  required
                  className="block w-full px-4 py-2 pr-10 border border-green-400 text-green-900 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-600 focus:bg-green-50 transition-colors sm:text-sm appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'farmer' | 'retailer')}
                  disabled={isLoading}
                >
                  <option value="farmer">🚜 I am a Farmer</option>
                  <option value="retailer">🛍️ I am a Retailer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="my-2 flex justify-center">
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token: string | null) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
              disabled={isLoading || isFormInvalid}
            >
              {isLoading ? <span className="opacity-0">Register</span> : 'Register'}
            </button>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;