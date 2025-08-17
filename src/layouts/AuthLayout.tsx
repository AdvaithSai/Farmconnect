import { Outlet, Link } from 'react-router-dom';
import { Wheat } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-green-700">
            <Wheat size={32} />
            <span className="text-2xl font-bold">FarmConnect</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome
          </h2>
        </div>
        
        <Outlet />
        
      </div>
    </div>
  );
};

export default AuthLayout;