import { Link } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { ShoppingBag, Tractor, Wheat, TrendingUp, BarChart3, HandCoins } from 'lucide-react';

const Home = () => {
  const user = useAppStore(state => state.user);
  
  // Redirect logged-in users to their respective dashboards
  if (user) {
    const dashboardPath = user.role === 'farmer' 
      ? '/farmer/dashboard' 
      : '/retailer/dashboard';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome back, {user.name}!</h1>
          <p className="mb-6 text-gray-600">You're already logged in.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={dashboardPath}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/profile"
              className="px-6 py-3 border border-green-600 text-green-600 font-medium rounded-md hover:bg-green-50 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Connecting Farmers Directly to Retailers
            </h1>
            <p className="text-xl mb-8 text-green-100 max-w-lg">
              Cut out the middleman. Get better prices for your crops as a farmer, or access fresh produce directly as a retailer.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-yellow-500 text-green-900 font-medium rounded-md hover:bg-yellow-400 transition-colors text-center"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white hover:text-green-800 transition-colors text-center"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <img 
              src="https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              alt="Farmer with crops" 
              className="rounded-lg shadow-2xl max-w-full h-auto"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Farmers */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Tractor size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">For Farmers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>List your crops with details and expected price</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Receive offers directly from retailers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Accept the best offer and arrange delivery</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Get paid faster with secure transactions</span>
                </li>
              </ul>
            </div>
            
            {/* For Retailers */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">For Retailers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Browse available crops from local farmers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Make offers at prices that work for you</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Communicate directly with farmers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Secure fresh produce at competitive prices</span>
                </li>
              </ul>
            </div>
            
            {/* Benefits */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Benefits</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cut out middlemen and increase profits</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Reduce food waste through direct connections</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Support local agriculture and sustainability</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access fresher produce with transparent sourcing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Wheat size={32} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Crop Listings</h3>
              <p className="text-gray-600">
                Detailed crop listings with quality information, quantities, and harvest dates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 size={32} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Price Negotiation</h3>
              <p className="text-gray-600">
                Fair and transparent offer system that lets both parties negotiate prices.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <HandCoins size={32} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and reliable payment processing once deals are confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">What Our Farmers Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-4 border-4 border-green-200">
                <img
                  src="https://images.pexels.com/photos/2804327/pexels-photo-2804327.jpeg?auto=compress&w=200&h=200&fit=crop" // Man planting rice
                  alt="Ramesh Kumar"
                  className="object-cover w-full h-full"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-2xl font-bold text-green-700">R</span>';
                    }
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Ramesh Kumar</h3>
              <p className="text-gray-600 mb-2">"This platform helped me get a much better price for my wheat. The process was simple and I could talk directly to retailers!"</p>
              <span className="text-sm text-green-600 font-medium">Farmer, Punjab</span>
            </div>
            {/* Review 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-4 border-4 border-green-200">
                <img
                  src="https://images.pexels.com/photos/916406/pexels-photo-916406.jpeg?auto=compress&w=200&h=200&fit=crop" // Woman picking plant
                  alt="Sunita Devi"
                  className="object-cover w-full h-full"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-2xl font-bold text-green-700">S</span>';
                    }
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Sunita Devi</h3>
              <p className="text-gray-600 mb-2">"I sold my vegetables quickly and received payment securely. Highly recommend to all fellow farmers!"</p>
              <span className="text-sm text-green-600 font-medium">Farmer, Maharashtra</span>
            </div>
            {/* Review 3 (optional) */}
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-4 border-4 border-green-200">
                <img
                  src="https://images.pexels.com/photos/2519332/pexels-photo-2519332.jpeg?auto=compress&w=200&h=200&fit=crop" // Man holding bottle
                  alt="Anil Singh"
                  className="object-cover w-full h-full"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-2xl font-bold text-green-700">A</span>';
                    }
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Anil Singh</h3>
              <p className="text-gray-600 mb-2">"Direct connection with buyers means no more middlemen. My profits have increased!"</p>
              <span className="text-sm text-green-600 font-medium">Farmer, Uttar Pradesh</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 bg-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Agricultural Business?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Join thousands of farmers and retailers already benefiting from direct trade connections.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-yellow-500 text-green-900 font-medium rounded-md hover:bg-yellow-400 transition-colors text-center"
            >
              Sign Up Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white hover:text-green-800 transition-colors text-center"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;