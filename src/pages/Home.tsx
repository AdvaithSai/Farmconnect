import { Link } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { ShoppingBag, Tractor, Wheat, TrendingUp, BarChart3, HandCoins } from 'lucide-react';
import ScrollSlider from '../components/ScrollSlider';
import ScrollReveal from '../components/ScrollReveal';

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
    <div className="flex flex-col overflow-hidden bg-gray-50">
      {/* Dynamic Parallax Hero Slider */}
      <ScrollSlider />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ScrollReveal delay={100} duration={900}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-gray-900 tracking-tight">
              A Smarter Way to Trade Produce
            </h2>
            <div className="w-16 h-1 bg-green-600 mx-auto mb-16 rounded-full" />
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Farmers */}
            <ScrollReveal delay={150} duration={800} distance="30px">
              <div className="h-full bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Tractor size={28} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">For Farmers</h3>
                <ul className="space-y-4 text-gray-600 font-medium">
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    <span>List your crops with details, photos, and expectations.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Receive offers directly from authenticated retailers.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Accept the ideal proposal and coordinate dispatch.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                    <span>Get paid rapidly through secure online gateways.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            
            {/* For Retailers */}
            <ScrollReveal delay={300} duration={800} distance="30px">
              <div className="h-full bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <ShoppingBag size={28} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">For Retailers</h3>
                <ul className="space-y-4 text-gray-600 font-medium">
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Browse freshly listed crops from regional farms.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Submit competitive proposals directly to farmers.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Negotiate values and ask queries over real-time chat.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 font-bold mr-3 bg-green-50 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                    <span>Secure supply transparency at premium valuations.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            
            {/* Benefits */}
            <ScrollReveal delay={450} duration={800} distance="30px">
              <div className="h-full bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <TrendingUp size={28} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Key Benefits</h3>
                <ul className="space-y-4 text-gray-600 font-medium">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3">✔</span>
                    <span>Direct commerce raises farmer margins by 20-30%.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3">✔</span>
                    <span>Dramatically decreases food loss during transits.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3">✔</span>
                    <span>Enhances sustainable farming networks locally.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3">✔</span>
                    <span>Complete pricing and sourcing transparency.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <ScrollReveal delay={100} duration={900}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-gray-900 tracking-tight">
              Powerful Core Features
            </h2>
            <div className="w-16 h-1 bg-green-600 mx-auto mb-16 rounded-full" />
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={150} duration={850}>
              <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Wheat size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Crop Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Post and monitor detailed crop listings, including expected harvest date, soil specs, and organic certifications.
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={300} duration={850}>
              <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <BarChart3 size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Live Offers</h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time negotiation systems allowing retailers and farmers to easily chat, align, and trade produce fairly.
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={450} duration={850}>
              <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <HandCoins size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Secure Settlement</h3>
                <p className="text-gray-600 leading-relaxed">
                  Integrated dynamic Razorpay payment checkouts to clear balances securely upon visual quality verifications.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      
      {/* Reviews Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ScrollReveal delay={100} duration={900}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-gray-900 tracking-tight">
              Testimonials from Our Farmers
            </h2>
            <div className="w-16 h-1 bg-green-600 mx-auto mb-16 rounded-full" />
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <ScrollReveal delay={150} duration={800} distance="30px">
              <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-6 border-4 border-green-200 shadow-md">
                  <img
                    src="https://images.pexels.com/photos/2804327/pexels-photo-2804327.jpeg?auto=compress&w=200&h=200&fit=crop"
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
                <h3 className="text-lg font-bold mb-1 text-gray-900">Ramesh Kumar</h3>
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-4">Farmer, Punjab</span>
                <p className="text-gray-600 leading-relaxed font-medium">
                  "This platform helped me get a much better price for my wheat. The process was simple and I could talk directly to retailers!"
                </p>
              </div>
            </ScrollReveal>

            {/* Review 2 */}
            <ScrollReveal delay={300} duration={800} distance="30px">
              <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-6 border-4 border-green-200 shadow-md">
                  <img
                    src="https://images.pexels.com/photos/916406/pexels-photo-916406.jpeg?auto=compress&w=200&h=200&fit=crop"
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
                <h3 className="text-lg font-bold mb-1 text-gray-900">Sunita Devi</h3>
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-4">Farmer, Maharashtra</span>
                <p className="text-gray-600 leading-relaxed font-medium">
                  "I sold my vegetables quickly and received payment securely. Highly recommend to all fellow farmers!"
                </p>
              </div>
            </ScrollReveal>

            {/* Review 3 */}
            <ScrollReveal delay={450} duration={800} distance="30px">
              <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-green-100 flex items-center justify-center mb-6 border-4 border-green-200 shadow-md">
                  <img
                    src="https://images.pexels.com/photos/2519332/pexels-photo-2519332.jpeg?auto=compress&w=200&h=200&fit=crop"
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
                <h3 className="text-lg font-bold mb-1 text-gray-900">Anil Singh</h3>
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-4">Farmer, Uttar Pradesh</span>
                <p className="text-gray-600 leading-relaxed font-medium">
                  "Direct connection with buyers means no more middlemen. My profits have increased!"
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-700 to-green-950 text-white relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollReveal delay={100} duration={850}>
            <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight max-w-2xl mx-auto">
              Ready to Transform Your Agricultural Business?
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-xl mx-auto text-green-100 font-medium">
              Join thousands of verified farmers and agricultural retailers directly trading fresh produce every single day.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={250} duration={850}>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold rounded-lg transition-all duration-200 text-center shadow-lg hover:shadow-yellow-500/10 transform hover:-translate-y-0.5 cursor-pointer"
              >
                Sign Up Today
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-transparent border border-white hover:bg-white hover:text-green-900 text-white font-bold rounded-lg transition-all duration-200 text-center transform hover:-translate-y-0.5 cursor-pointer"
              >
                Partner Login
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;