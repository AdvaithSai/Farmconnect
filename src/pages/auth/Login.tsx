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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const login = useAppStore(state => state.login);
  const loginWithGoogle = useAppStore(state => state.loginWithGoogle);
  const loginWithFacebook = useAppStore(state => state.loginWithFacebook);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast.error('Please verify that you are not a robot.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error && typeof (error as unknown as { message?: string }).message === 'string'
          ? (error as unknown as { message: string }).message
          : JSON.stringify(error) || 'Failed to login';
        toast.error(errorMsg);
      } else {
        // Get user role and redirect accordingly
        const user = useAppStore.getState().user;
        if (user) {
          const dashboardPath = user.role === 'farmer' 
            ? '/farmer/dashboard' 
            : '/retailer/dashboard';
          toast.success('Login successful!');
          navigate(dashboardPath);
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <ThemeLoader />
        </div>
      )}
      <div className={`max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md transition-all duration-300 ${isLoading ? 'blur-sm pointer-events-none select-none opacity-60' : ''}`}>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-green-700">Sign in to your account</h2>
        <div className="flex flex-col gap-3 w-full mb-1">
          <button
            type="button"
            className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 text-xl" /> Continue with Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={handleFacebookLogin}
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
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
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
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-500 font-medium">Forgot password?</Link>
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
              disabled={isLoading}
            >
              {isLoading ? <span className="opacity-0">Sign in</span> : 'Sign in'}
            </button>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;