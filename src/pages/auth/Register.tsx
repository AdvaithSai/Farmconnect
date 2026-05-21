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
    <div className="min-h-screen flex bg-gradient-to-br from-[#020d06] via-[#071d10] to-[#010804] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Cinematic Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <ThemeLoader />
        </div>
      )}

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden border-r border-white/5 bg-gradient-to-br from-green-950/20 via-emerald-950/10 to-black/40 backdrop-blur-lg"
      >
        {/* Decorative subtle circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-emerald-500 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-5 bg-gradient-to-br from-yellow-500 to-transparent blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur shadow-lg">
              <Sprout size={22} className="text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-yellow-400 via-emerald-400 to-green-400 text-transparent bg-clip-text font-black text-2xl tracking-tight">FarmConnect</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">India's agri marketplace</p>
        </div>

        {/* Role selector hint */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
              Join as a<br />
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">Farmer or Retailer</span>
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Create your free account and start trading directly. No middlemen, transparent pricing.
            </p>
          </div>

          {/* Role cards */}
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md hover:border-yellow-400/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚜</span>
                <span className="text-white font-bold text-sm">Farmer</span>
              </div>
              <ul className="text-gray-300 text-xs space-y-1 font-medium">
                <li>• List your crops with photos & pricing</li>
                <li>• Receive & accept offers from retailers</li>
                <li>• Get paid securely after delivery</li>
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md hover:border-emerald-400/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🛍️</span>
                <span className="text-white font-bold text-sm">Retailer</span>
              </div>
              <ul className="text-gray-300 text-xs space-y-1 font-medium">
                <li>• Browse fresh crops from local farmers</li>
                <li>• Negotiate prices through live chat</li>
                <li>• Track deliveries in real-time</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-gray-400 text-xs font-semibold">
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-6 lg:p-10 overflow-y-auto relative z-10">
        <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative py-6 my-4">
          
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-yellow-400 to-emerald-400 text-transparent bg-clip-text font-black text-xl">FarmConnect</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Create account</h1>
            <p className="text-gray-400 text-sm">Join thousands of farmers & retailers</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-sm hover:border-yellow-400 hover:bg-white/10 transition-all duration-300 shadow-md disabled:opacity-50 active:scale-[0.98]"
            >
              <FcGoogle size={20} /> Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-sm hover:border-emerald-400 hover:bg-white/10 transition-all duration-300 shadow-md disabled:opacity-50 active:scale-[0.98]"
            >
              <FaFacebook size={20} className="text-blue-500" /> Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#04140b] rounded-full border border-white/5 text-gray-400 font-bold uppercase tracking-widest text-[10px]">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-300">Full Name</label>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                value={name} onChange={e => setName(e.target.value)} disabled={isLoading}
                placeholder="Pranav Sharma"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-300">Email address</label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" required
                  value={password} onChange={handlePasswordChange} disabled={isLoading}
                  onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                    passwordError && password ? 'border-red-500/50 bg-red-950/20 focus:border-red-500' : 'border-white/10 bg-white/5 focus:border-emerald-500'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password checklist */}
              {(passwordFocused || password) && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-2 grid grid-cols-2 gap-2">
                  {passwordChecks.map((c, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs font-semibold ${c.valid ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {c.valid
                        ? <Check size={12} className="shrink-0 text-emerald-400" />
                        : <X size={12} className="shrink-0 text-gray-500" />}
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retype Password */}
            <div className="space-y-1">
              <label htmlFor="retype-password" className="block text-sm font-semibold text-gray-300">Confirm Password</label>
              <div className="relative">
                <input
                  id="retype-password" name="retype-password" type={showRetype ? 'text' : 'password'}
                  autoComplete="new-password" required
                  value={retypePassword} onChange={handleRetypeChange} disabled={isLoading}
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                    retypeError ? 'border-red-500/50 bg-red-950/20 focus:border-red-500' : 'border-white/10 bg-white/5 focus:border-emerald-500'
                  }`}
                />
                <button type="button" onClick={() => setShowRetype(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" tabIndex={-1}>
                  {showRetype ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {retypeError && <p className="text-xs text-red-400 mt-1 font-semibold">{retypeError}</p>}
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">I am joining as</label>
              <div className="grid grid-cols-2 gap-3">
                {(['farmer', 'retailer'] as const).map(r => (
                  <button
                    key={r} type="button"
                    onClick={() => setRole(r)}
                    className={`py-3.5 px-4 rounded-xl border font-bold text-sm transition-all duration-300 active:scale-[0.98] ${
                      role === r
                        ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400'
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm transition-all duration-300 shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-yellow-400 hover:text-yellow-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;