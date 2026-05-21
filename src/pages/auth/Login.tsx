// Note: reCAPTCHA is disabled for local testing. Re-enable before deploying to production.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Eye, EyeOff, Sprout, Wheat, ShieldCheck, Users } from 'lucide-react';
import ThemeLoader from '../../components/ThemeLoader';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    { icon: <Wheat size={20} />, label: 'Transactions', value: '₹4.2Cr+' },
    { icon: <ShieldCheck size={20} />, label: 'Secure Payments', value: '100%' },
  ];

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
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r border-white/5 bg-gradient-to-br from-green-950/20 via-emerald-950/10 to-black/40 backdrop-blur-lg"
      >
        {/* Decorative subtle circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-5 bg-gradient-to-br from-emerald-500 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-5 bg-gradient-to-br from-yellow-500 to-transparent blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur shadow-lg">
              <Sprout size={22} className="text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-yellow-400 via-emerald-400 to-green-400 text-transparent bg-clip-text font-black text-2xl tracking-tight">FarmConnect</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Connecting farmers directly to retailers</p>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-extrabold leading-tight mb-4">
              Grow your farm,<br />
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">grow your income.</span>
            </h2>
            <p className="text-gray-300 text-base leading-relaxed max-w-sm font-medium">
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
              <div key={i} className="flex items-start gap-3 bg-white/5 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 shadow-lg hover:border-yellow-400/20 transition-all duration-300 group">
                <span className="text-2xl mt-0.5 group-hover:scale-110 transition-transform duration-300">{f.emoji}</span>
                <div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex gap-6 pt-6 border-t border-white/10">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-yellow-400">{s.icon}</div>
              <div>
                <p className="text-white font-black text-sm">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center">
              <Sprout size={16} className="text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-yellow-400 to-emerald-400 text-transparent bg-clip-text font-black text-xl">FarmConnect</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-sm hover:border-yellow-400 hover:bg-white/10 transition-all duration-300 shadow-md disabled:opacity-50 active:scale-[0.98]"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-sm hover:border-emerald-400 hover:bg-white/10 transition-all duration-300 shadow-md disabled:opacity-50 active:scale-[0.98]"
            >
              <FaFacebook size={20} className="text-blue-500" />
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#04140b] rounded-full border border-white/5 text-gray-400 font-bold uppercase tracking-widest text-[10px]">or sign in with email</span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-300">
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
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300 disabled:bg-white/5 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
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
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300 disabled:bg-white/5 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right pt-1">
                <Link to="/forgot-password" className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-sm transition-all duration-300 shadow-lg hover:shadow-yellow-500/10 active:scale-[0.98] disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;