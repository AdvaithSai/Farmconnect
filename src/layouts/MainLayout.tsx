import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Wheat } from 'lucide-react';
import { useAppStore } from '../lib/store';
import GoogleTranslate from '../components/GoogleTranslate';

const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Wheat size={28} />
              <span className="text-xl font-bold">FarmConnect</span>
            </Link>
            <GoogleTranslate />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {/* Farmer Navigation */}
                {user.role === 'farmer' && (
                  <div className="flex items-center space-x-6">
                    <Link to="/farmer/dashboard" className="hover:text-yellow-200 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/farmer/add-crop" className="hover:text-yellow-200 transition-colors">
                      Add Crop
                    </Link>
                    <Link to="/farmer/offers" className="hover:text-yellow-200 transition-colors">
                      Manage Offers
                    </Link>
                    <Link to="/profile" className="hover:text-yellow-200 transition-colors">
                      Profile
                    </Link>
                  </div>
                )}
                
                {/* Retailer Navigation */}
                {user.role === 'retailer' && (
                  <div className="flex items-center space-x-6">
                    <Link to="/retailer/dashboard" className="hover:text-yellow-200 transition-colors">
                      Browse Crops
                    </Link>
                    <Link to="/retailer/offers" className="hover:text-yellow-200 transition-colors">
                      My Offers
                    </Link>
                    <Link to="/profile" className="hover:text-yellow-200 transition-colors">
                      Profile
                    </Link>
                  </div>
                )}
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-2 hover:text-yellow-200 transition-colors cursor-pointer"
                  >
                    <User size={20} />
                    <span>{user.name}</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-green-800 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-yellow-500 text-green-900 font-medium rounded-md hover:bg-yellow-400 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-yellow-500 text-green-900 font-medium rounded-md hover:bg-yellow-400 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-green-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden bg-green-800 px-4 py-4">
            {user ? (
              <div className="flex flex-col space-y-4">
                {/* Farmer Navigation */}
                {user.role === 'farmer' && (
                  <>
                    <Link 
                      to="/farmer/dashboard" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/farmer/add-crop" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Add Crop
                    </Link>
                    <Link 
                      to="/farmer/offers" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Manage Offers
                    </Link>
                    <Link 
                      to="/profile" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
                
                {/* Retailer Navigation */}
                {user.role === 'retailer' && (
                  <>
                    <Link 
                      to="/retailer/dashboard" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Browse Crops
                    </Link>
                    <Link 
                      to="/retailer/offers" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Offers
                    </Link>
                    <Link 
                      to="/profile" 
                      className="hover:text-yellow-200 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
                
                {/* User Menu */}
                <div className="pt-4 border-t border-green-600">
                  <button 
                    onClick={() => {
                      navigate('/profile');
                      setMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 mb-4 hover:text-yellow-200 transition-colors cursor-pointer w-full text-left"
                  >
                    <User size={20} />
                    <span>{user.name}</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-yellow-200 hover:text-white transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/login" 
                  className="hover:text-yellow-200 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="hover:text-yellow-200 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-green-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="flex items-center space-x-2">
                <Wheat size={24} />
                <span className="text-xl font-bold">FarmConnect</span>
              </Link>
              <p className="mt-2 max-w-md text-green-200">
                Connecting farmers directly to retailers for a more sustainable and profitable agricultural ecosystem.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-200">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-green-200 hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/login" className="text-green-200 hover:text-white transition-colors">Login</Link></li>
                  <li><Link to="/register" className="text-green-200 hover:text-white transition-colors">Register</Link></li>
                  {user && <li><Link to="/profile" className="text-green-200 hover:text-white transition-colors">Profile</Link></li>}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 text-yellow-200">Contact</h3>
                <ul className="space-y-2 text-green-200">
                  <li>support@farmconnect.com</li>
                  <li>+1 (555) 123-4567</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-green-700 text-center text-green-300 text-sm">
            © {new Date().getFullYear()} FarmConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;