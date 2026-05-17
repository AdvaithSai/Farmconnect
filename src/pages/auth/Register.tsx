import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Eye, EyeOff, Sprout, Check, X } from 'lucide-react';
import ThemeLoader from '../../components/ThemeLoader';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'farmer' | 'retailer'>('farmer');
  const [isLoading, setIsLoading] = useState(false);
  const [retypePassword, setRetypePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [retypeError, setRetypeError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetype, setShowRetype] = useState(false);

  const register = useAppStore(state => state.register);
  const loginWithGoogle = useAppStore(state => state.loginWithGoogle);
  const loginWithFacebook = useAppStore(state => state.loginWithFacebook);
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'At least 6 characters required.';
    if (!/[A-Z]/.test(pwd)) return 'Must contain a capital letter.';
    if (!/[0-9]/.test(pwd)) return 'Must contain a number.';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Must contain a special character.';
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
    setRetypeError(password !== e.target.value ? 'Passwords do not match.' : '');
  };

  const passwordChecks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'One capital letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const isFormInvalid =
    !!passwordError || !!retypeError || !password || !retypePassword || password !== retypePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await register(email, password, name, role);
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : 'Failed to register';
        toast.error(errorMsg);
      } else {
        toast.success('Account created successfully!');
        navigate(role === 'farmer' ? '/farmer/dashboard' : '/retailer/dashboard');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    const { error } = await loginWithGoogle();
    setIsLoading(false);
    if (error) { toast.error('Google sign-in failed.'); }
    else { toast.success('Signed in with Google!'); navigate('/retailer/dashboard'); }
  };

  const handleFacebookRegister = async () => {
    setIsLoading(true);
    const { error } = await loginWithFacebook();
    setIsLoading(false);
    if (error) { toast.error('Facebook sign-in failed.'); }
    else { toast.success('Signed in with Facebook!'); navigate('/retailer/dashboard'); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <ThemeLoader />
        </div>
      )}

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #14532d 0%, #166534 40%, #15803d 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #bbf7d0, transparent)' }} />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fef08a, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Sprout size={22} className="text-green-200" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">FarmConnect</span>
          </div>
          <p className="text-green-200 text-sm mt-2">India's agri marketplace</p>
        </div>

        {/* Role selector hint */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-white text-3xl font-bold leading-tight mb-3">
              Join as a<br />
              <span className="text-yellow-300">Farmer or Retailer</span>
            </h2>
            <p className="text-green-200 text-sm leading-relaxed">
              Create your free account and start trading directly. No middlemen, transparent pricing.
            </p>
          </div>

          {/* Role cards */}
          <div className="space-y-3">
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚜</span>
                <span className="text-white font-semibold">Farmer</span>
              </div>
              <ul className="text-green-200 text-xs space-y-1">
                <li>• List your crops with photos & pricing</li>
                <li>• Receive & accept offers from retailers</li>
                <li>• Get paid securely after delivery</li>
              </ul>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🛍️</span>
                <span className="text-white font-semibold">Retailer</span>
              </div>
              <ul className="text-green-200 text-xs space-y-1">
                <li>• Browse fresh crops from local farmers</li>
                <li>• Negotiate prices through live chat</li>
                <li>• Track deliveries in real-time</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-green-300 text-xs">
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center bg-gray-50 p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <span className="text-green-800 text-xl font-bold">FarmConnect</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-500 text-sm">Join thousands of farmers & retailers</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium text-sm hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <FcGoogle size={20} /> Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <FaFacebook size={20} className="text-blue-600" /> Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gray-50 text-gray-400 font-medium uppercase tracking-widest">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                value={name} onChange={e => setName(e.target.value)} disabled={isLoading}
                placeholder="Pranav Sharma"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" required
                  value={password} onChange={handlePasswordChange} disabled={isLoading}
                  onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 transition-all duration-200 ${
                    passwordError && password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-green-500'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password checklist */}
              {(passwordFocused || password) && (
                <div className="bg-gray-100 rounded-xl p-3 mt-1 grid grid-cols-2 gap-1">
                  {passwordChecks.map((c, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs ${c.valid ? 'text-green-600' : 'text-gray-400'}`}>
                      {c.valid
                        ? <Check size={12} className="shrink-0" />
                        : <X size={12} className="shrink-0" />}
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retype Password */}
            <div className="space-y-1">
              <label htmlFor="retype-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  id="retype-password" name="retype-password" type={showRetype ? 'text' : 'password'}
                  autoComplete="new-password" required
                  value={retypePassword} onChange={handleRetypeChange} disabled={isLoading}
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 transition-all duration-200 ${
                    retypeError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-green-500'
                  }`}
                />
                <button type="button" onClick={() => setShowRetype(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showRetype ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {retypeError && <p className="text-xs text-red-500 mt-1">{retypeError}</p>}
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">I am joining as</label>
              <div className="grid grid-cols-2 gap-3">
                {(['farmer', 'retailer'] as const).map(r => (
                  <button
                    key={r} type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${
                      role === r
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <span className="mr-1.5">{r === 'farmer' ? '🚜' : '🛍️'}</span>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isFormInvalid || !name || !email}
              className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-green-600 hover:text-green-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;