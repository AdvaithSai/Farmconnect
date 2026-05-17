// Note: reCAPTCHA is disabled for local testing. Re-enable before deploying to production.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Eye, EyeOff, Sprout, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import ThemeLoader from '../../components/ThemeLoader';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // reCAPTCHA disabled for testing
  // const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const login = useAppStore(state => state.login);
  const loginWithGoogle = useAppStore(state => state.loginWithGoogle);
  const loginWithFacebook = useAppStore(state => state.loginWithFacebook);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error &&
          typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : 'Failed to login';
        toast.error(errorMsg);
      } else {
        const user = useAppStore.getState().user;
        if (user) {
          toast.success('Welcome back!');
          navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/retailer/dashboard');
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  const handleFacebookLogin = async () => {
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

  const stats = [
    { icon: <Users size={20} />, label: 'Active Farmers', value: '12,000+' },
    { icon: <TrendingUp size={20} />, label: 'Transactions', value: '₹4.2Cr+' },
    { icon: <ShieldCheck size={20} />, label: 'Secure Payments', value: '100%' },
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <ThemeLoader />
        </div>
      )}

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #14532d 0%, #166534 40%, #15803d 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #bbf7d0, transparent)' }} />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fef08a, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Sprout size={22} className="text-green-200" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">FarmConnect</span>
          </div>
          <p className="text-green-200 text-sm mt-1">Connecting farmers directly to retailers</p>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Grow your farm,<br />
              <span className="text-yellow-300">grow your income.</span>
            </h2>
            <p className="text-green-200 text-base leading-relaxed max-w-sm">
              Join thousands of farmers and retailers on India's most trusted agricultural marketplace. No middlemen. Better prices. Faster deals.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              { emoji: '🌾', title: 'Direct Crop Listings', desc: 'List your harvest with full control over price' },
              { emoji: '💬', title: 'Real-time Negotiations', desc: 'Chat and close deals directly with buyers' },
              { emoji: '💳', title: 'Secure Payments', desc: 'Razorpay-powered, instant settlements' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <span className="text-2xl mt-0.5">{f.emoji}</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-green-200 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex gap-6 pt-6 border-t border-white/20">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-green-300">{s.icon}</div>
              <div>
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-green-300 text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <span className="text-green-800 text-xl font-bold">FarmConnect</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium text-sm hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <FaFacebook size={20} className="text-blue-600" />
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gray-50 text-gray-400 font-medium uppercase tracking-widest">or sign in with email</span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right pt-1">
                <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-green-300 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-green-600 hover:text-green-700">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;