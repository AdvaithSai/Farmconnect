import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, Wheat, ArrowLeft, LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import GoogleTranslate from '../components/GoogleTranslate';

const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRootPath = location.pathname === '/';
  const isActiveRoute = (path: string) => location.pathname === path;

  // Handle scroll detection for root path to trigger elegant transition
  useEffect(() => {
    if (!isRootPath) {
      setScrolled(true);
      return;
    }
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    // Set initial value
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRootPath]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium Glassmorphic Morphing Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-500 ease-out flex justify-center w-full pointer-events-none ${
        isRootPath 
          ? scrolled 
            ? 'p-3 md:p-4' 
            : 'p-0'
          : 'p-3 md:p-4'
      }`}>
        <div className={`w-full transition-all duration-500 ease-out pointer-events-auto ${
          isRootPath 
            ? scrolled 
              ? 'max-w-6xl rounded-full bg-emerald-950/80 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.35)] py-2 px-6 md:px-8 backdrop-blur-lg hover:bg-emerald-950/85' 
              : 'max-w-full rounded-none bg-black/20 border-b border-white/5 py-4 px-4 md:px-8 backdrop-blur-sm'
            : 'max-w-6xl rounded-full bg-emerald-950/85 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.35)] py-2 px-6 md:px-8 backdrop-blur-lg hover:bg-emerald-950/90'
        }`}>
          <div className="flex justify-between items-center relative">
            <div className="flex items-center space-x-4">
              {!isRootPath && (
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 transition-all duration-300 text-white hover:text-yellow-400 cursor-pointer active:scale-90 shadow-sm"
                  title="Go back to previous page"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="p-1.5 bg-gradient-to-tr from-yellow-500 via-emerald-500 to-green-500 rounded-xl shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Wheat size={22} className="text-white relative z-10" />
                </div>
                <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-400 via-emerald-400 to-green-400 text-transparent bg-clip-text hover:brightness-110 transition-all duration-300">
                  FarmConnect
                </span>
              </Link>
            </div>
            
            {/* Right Side: Navigation, Translate, User Profile, Mobile Menu */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Desktop Navigation Links */}
              {user && (
                <nav className="hidden md:flex items-center space-x-6 mr-2">
                  {/* Farmer Navigation Links */}
                  {user.role === 'farmer' && (
                    <>
                      <Link 
                        to="/farmer/dashboard" 
                        className={`relative font-bold text-sm tracking-wide transition-all duration-300 py-1 ${
                          isActiveRoute('/farmer/dashboard') 
                            ? 'text-yellow-400 font-extrabold after:w-full' 
                            : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full`}
                      >
                        Dashboard
                        {isActiveRoute('/farmer/dashboard') && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                        )}
                      </Link>
                      <Link 
                        to="/farmer/add-crop" 
                        className={`relative font-bold text-sm tracking-wide transition-all duration-300 py-1 ${
                          isActiveRoute('/farmer/add-crop') 
                            ? 'text-yellow-400 font-extrabold after:w-full' 
                            : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full`}
                      >
                        Add Crop
                        {isActiveRoute('/farmer/add-crop') && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                        )}
                      </Link>
                      <Link 
                        to="/farmer/offers" 
                        className={`relative font-bold text-sm tracking-wide transition-all duration-300 py-1 ${
                          isActiveRoute('/farmer/offers') 
                            ? 'text-yellow-400 font-extrabold after:w-full' 
                            : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full`}
                      >
                        Manage Offers
                        {isActiveRoute('/farmer/offers') && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                        )}
                      </Link>
                    </>
                  )}
                  
                  {/* Retailer Navigation Links */}
                  {user.role === 'retailer' && (
                    <>
                      <Link 
                        to="/retailer/dashboard" 
                        className={`relative font-bold text-sm tracking-wide transition-all duration-300 py-1 ${
                          isActiveRoute('/retailer/dashboard') 
                            ? 'text-yellow-400 font-extrabold after:w-full' 
                            : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full`}
                      >
                        Browse Crops
                        {isActiveRoute('/retailer/dashboard') && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                        )}
                      </Link>
                      <Link 
                        to="/retailer/offers" 
                        className={`relative font-bold text-sm tracking-wide transition-all duration-300 py-1 ${
                          isActiveRoute('/retailer/offers') 
                            ? 'text-yellow-400 font-extrabold after:w-full' 
                            : 'text-white/85 hover:text-white after:w-0 hover:after:w-full'
                        } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-yellow-400 after:transition-all after:duration-300 after:rounded-full`}
                      >
                        My Offers
                        {isActiveRoute('/retailer/offers') && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                        )}
                      </Link>
                    </>
                  )}
                </nav>
              )}
              
              {/* Stable, Persistently Mounted Google Translate Widget (Always visible on mobile & desktop) */}
              <div className="flex items-center">
                <GoogleTranslate id="google_translate_element" />
              </div>
              
              {/* Desktop User Options or Auth Pills */}
              <div className="hidden md:block">
                {user ? (
                  <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 border border-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] backdrop-blur-md rounded-full px-4 py-1.5 transition-all duration-300">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-all duration-300 cursor-pointer group"
                      title="View Profile"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 group-hover:from-yellow-500 group-hover:to-amber-400 flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <User size={13} className="group-hover:rotate-6 transition-transform duration-300" />
                      </div>
                      <span className="text-xs font-bold tracking-wide">{user.name}</span>
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all duration-300 cursor-pointer active:scale-95 shadow-sm"
                      title="Logout"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)] backdrop-blur-md rounded-full px-4 py-1.5 transition-all duration-300">
                    <Link 
                      to="/login" 
                      className="px-4 py-1.5 text-xs font-extrabold bg-transparent border border-white/30 text-white rounded-full hover:bg-white hover:text-green-950 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="px-4 py-1.5 text-xs font-extrabold bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-green-950 rounded-full transition-all duration-300 shadow-md hover:shadow-yellow-500/20 transform hover:-translate-y-0.5 active:scale-95"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all cursor-pointer active:scale-95"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation with Frosted Slide Down as a beautiful floating island drawer */}
        {menuOpen && (
          <nav className="md:hidden absolute top-[calc(100%+12px)] left-0 right-0 mx-auto max-w-[calc(100vw-32px)] bg-emerald-950/95 backdrop-blur-xl border border-white/15 p-6 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300 z-50 pointer-events-auto">
            {user ? (
              <div className="flex flex-col space-y-4">
                {/* Farmer Mobile Navigation */}
                {user.role === 'farmer' && (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      to="/farmer/dashboard" 
                      className={`flex items-center space-x-3 text-base font-bold tracking-wide py-2.5 px-4 rounded-xl border border-transparent transition-all duration-200 ${
                        isActiveRoute('/farmer/dashboard')
                          ? 'bg-white/10 text-yellow-400 border-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className={isActiveRoute('/farmer/dashboard') ? 'text-yellow-400' : 'text-white/60'} />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      to="/farmer/add-crop" 
                      className={`flex items-center space-x-3 text-base font-bold tracking-wide py-2.5 px-4 rounded-xl border border-transparent transition-all duration-200 ${
                        isActiveRoute('/farmer/add-crop')
                          ? 'bg-white/10 text-yellow-400 border-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <PlusCircle size={18} className={isActiveRoute('/farmer/add-crop') ? 'text-yellow-400' : 'text-white/60'} />
                      <span>Add Crop</span>
                    </Link>
                    <Link 
                      to="/farmer/offers" 
                      className={`flex items-center space-x-3 text-base font-bold tracking-wide py-2.5 px-4 rounded-xl border border-transparent transition-all duration-200 ${
                        isActiveRoute('/farmer/offers')
                          ? 'bg-white/10 text-yellow-400 border-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <History size={18} className={isActiveRoute('/farmer/offers') ? 'text-yellow-400' : 'text-white/60'} />
                      <span>Manage Offers</span>
                    </Link>
                  </div>
                )}
                
                {/* Retailer Mobile Navigation */}
                {user.role === 'retailer' && (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      to="/retailer/dashboard" 
                      className={`flex items-center space-x-3 text-base font-bold tracking-wide py-2.5 px-4 rounded-xl border border-transparent transition-all duration-200 ${
                        isActiveRoute('/retailer/dashboard')
                          ? 'bg-white/10 text-yellow-400 border-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className={isActiveRoute('/retailer/dashboard') ? 'text-yellow-400' : 'text-white/60'} />
                      <span>Browse Crops</span>
                    </Link>
                    <Link 
                      to="/retailer/offers" 
                      className={`flex items-center space-x-3 text-base font-bold tracking-wide py-2.5 px-4 rounded-xl border border-transparent transition-all duration-200 ${
                        isActiveRoute('/retailer/offers')
                          ? 'bg-white/10 text-yellow-400 border-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <History size={18} className={isActiveRoute('/retailer/offers') ? 'text-yellow-400' : 'text-white/60'} />
                      <span>My Offers</span>
                    </Link>
                  </div>
                )}
                
                {/* User Mobile Actions */}
                <div className="pt-4 flex items-center justify-between border-t border-white/15">
                  <button 
                    onClick={() => {
                      navigate('/profile');
                      setMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:text-yellow-400 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-white shadow-sm border border-white/20">
                      <User size={15} />
                    </div>
                    <span className="font-bold text-sm">{user.name}</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/20 text-red-300 hover:text-white hover:bg-red-500/30 transition-all duration-200"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-bold">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 pt-2">
                <Link 
                  to="/login" 
                  className="flex-1 text-center py-2.5 text-sm font-extrabold bg-transparent border border-white/25 text-white rounded-full hover:bg-white hover:text-green-950 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="flex-1 text-center py-2.5 text-sm font-extrabold bg-gradient-to-r from-yellow-500 to-amber-500 text-green-950 rounded-full hover:from-yellow-400 hover:to-amber-400 transition-all duration-200 shadow-md"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>
      
      {/* Main Content with dynamic top margin based on view route */}
      <main className={`flex-grow ${isRootPath ? '' : 'pt-[88px]'}`}>
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-green-900 text-white py-8 border-t border-green-800">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="flex items-center space-x-2">
                <Wheat size={24} className="text-yellow-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 text-transparent bg-clip-text">FarmConnect</span>
              </Link>
              <p className="mt-2 max-w-md text-green-200/80 text-sm leading-relaxed">
                Connecting farmers directly to retailers for a more sustainable, transparent, and profitable agricultural ecosystem.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-base font-bold mb-4 text-yellow-400 uppercase tracking-wider">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/" className="text-green-200/80 hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/login" className="text-green-200/80 hover:text-white transition-colors">Login</Link></li>
                  <li><Link to="/register" className="text-green-200/80 hover:text-white transition-colors">Register</Link></li>
                  {user && <li><Link to="/profile" className="text-green-200/80 hover:text-white transition-colors">Profile</Link></li>}
                </ul>
              </div>
              
              <div>
                <h3 className="text-base font-bold mb-4 text-yellow-400 uppercase tracking-wider">Contact</h3>
                <ul className="space-y-2 text-sm text-green-200/80">
                  <li>22b81a6703.genai24@gmail.com</li>
                  <li>+91 9490666957</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-green-800 text-center text-green-300/60 text-xs">
            © {new Date().getFullYear()} FarmConnect. All rights reserved. Built with premium design standards.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;