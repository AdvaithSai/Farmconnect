import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingBag, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThemeLoader from '../../components/ThemeLoader';

type Transaction = {
  id: string;
  crop_id: string;
  farmer_id: string;
  retailer_id: string;
  offer_id: string;
  price: number;
  amount: number; // Add this line to fix linter error
  created_at: string;
  status: string;
};

// Define types for Razorpay
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const RetailerDashboard = () => {
  const { user, crops, loading, fetchCrops, userOffers } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'available' as 'all' | 'available',
    sortBy: 'newest' as 'newest' | 'oldest' | 'price_low' | 'price_high'
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cropNames, setCropNames] = useState<{ [id: string]: string }>({});
  const [farmerNames, setFarmerNames] = useState<{ [id: string]: string }>({});
  const [cropQuantities, setCropQuantities] = useState<{ [id: string]: number }>({});
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCrops();
  }, [filters.status, filters.sortBy, fetchCrops]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      // Fetch all transactions for this retailer, regardless of status
      const q = query(collection(db, 'transactions'), where('retailer_id', '==', user.id));
      const snap = await getDocs(q);
      const txns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txns);
      // Fetch crop and farmer names
      const uniqueCropIds = Array.from(new Set(txns.map(t => t.crop_id)));
      const uniqueFarmerIds = Array.from(new Set(txns.map(t => t.farmer_id)));
      const cropNameMap: { [id: string]: string } = {};
      const farmerNameMap: { [id: string]: string } = {};
      const cropQuantities: { [id: string]: number } = {};
      await Promise.all(uniqueCropIds.map(async (id) => {
        if (!id) return;
        try {
          const cropDoc = await getDocs(query(collection(db, 'crops'), where('__name__', '==', id)));
          if (!cropDoc.empty) {
            const data = cropDoc.docs[0].data();
            cropNameMap[id] = data.name || id;
            cropQuantities[id] = data.quantity || 1;
          } else {
            cropNameMap[id] = id;
            cropQuantities[id] = 1;
          }
        } catch {
          cropNameMap[id] = id;
          cropQuantities[id] = 1;
        }
      }));
      await Promise.all(uniqueFarmerIds.map(async (id) => {
        if (!id) return;
        try {
          const farmerDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', id)));
          if (!farmerDoc.empty) {
            const data = farmerDoc.docs[0].data();
            farmerNameMap[id] = data.name || id;
          } else {
            farmerNameMap[id] = id;
          }
        } catch {
          farmerNameMap[id] = id;
        }
      }));
      setCropNames(cropNameMap);
      setFarmerNames(farmerNameMap);
      setCropQuantities({ ...cropQuantities });
    };
    fetchTransactions();
  }, [user]);
  
  // Only show crops with status 'available'
  const availableCrops = crops.filter(crop => crop.status === 'available');
  // Filter by search term
  const filteredCrops = searchTerm
    ? availableCrops.filter(crop => 
        crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableCrops;
  
  // Razorpay payment handler
  const handlePayNow = async (offer: { id: string; price: number; crop_id: string }) => {
    // Find the pending transaction for this offer
    // const pendingTxn = transactions.find(t => t.offer_id === offer.id && t.status === 'pending_payment');
    // Remove test code that marks transaction as completed and crop as sold
    // Fetch Razorpay Key ID from backend
    const keyId = 'rzp_test_wrGIN9cKqc1B1a'; // <-- Replace with your actual Razorpay key
    // Calculate total price
    const quantity = cropQuantities[offer.crop_id] || 1;
    const totalPrice = offer.price * quantity;
    const res = await fetch('http://localhost:3000/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalPrice,
        receipt: offer.id,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      alert('Failed to create order');
      return;
    }
    const options = {
      key: keyId,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'FarmConnect',
      description: 'Crop Payment',
      order_id: data.order.id,
      handler: async function (response: RazorpayResponse) {
        alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
        // Mark transaction as completed
        try {
          // Find the transaction for this offer
          const pendingTxn = transactions.find(t => t.offer_id === offer.id && t.status === 'pending_payment');
          if (pendingTxn) {
            await fetch('http://localhost:3000/mark-transaction-completed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: pendingTxn.id }),
            });
            await fetch('http://localhost:3000/mark-crop-sold', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cropId: pendingTxn.crop_id }),
            });
            // Reload the page to update UI for both dashboards
            window.location.reload();
          }
        } catch {
          alert('Payment succeeded but failed to update transaction/crop status. Please refresh.');
        }
      },
      prefill: {
        email: user?.email,
      },
      theme: { color: '#3399cc' },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Please log in to access the retailer dashboard.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Crops</h1>
          <p className="text-gray-600">Browse and purchase crops directly from farmers</p>
        </div>
        <Link
          to="/retailer/chats"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
        >
          <MessageCircle size={20} className="mr-2" />
          Messages
        </Link>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="relative flex-grow mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search crops by name, description, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'available' }))}
              >
                <option value="available">Available Only</option>
                <option value="all">All Crops</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="sortBy" className="text-sm text-gray-700">Sort by:</label>
              <select
                id="sortBy"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'newest' | 'oldest' | 'price_low' | 'price_high' }))}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Crops Grid */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <ThemeLoader />
          </div>
        )}
        <div className={loading ? 'blur-sm pointer-events-none select-none opacity-60 transition-all duration-300' : ''}>
          {filteredCrops.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "No crops match your search criteria. Try a different search term."
                  : "There are no available crops at the moment. Please check back later."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCrops.map((crop) => (
                <Link 
                  key={crop.id}
                  to={`/retailer/crop/${crop.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-green-100 relative">
                    {crop.image_url ? (
                      <img 
                        src={crop.image_url} 
                        alt={crop.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-100">
                        <span className="text-green-600 text-4xl font-bold">{crop.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{crop.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {crop.description.length > 100 
                        ? `${crop.description.substring(0, 100)}...` 
                        : crop.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Quantity:</span> {crop.quantity} {crop.unit}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Location:</span> {crop.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${crop.price_expectation?.toFixed(2) || 'Negotiable'}
                        </p>
                        <p className="text-xs text-gray-500">per {crop.unit}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Unknown Farmer</p>
                        <p>Harvested: {new Date(crop.harvest_date).toLocaleDateString()}</p>
                      </div>
                      {/* Pay Now button logic */}
                      {(() => {
                        const offer = userOffers.find(o => o.crop_id === crop.id && o.retailer_id === user.id && o.status === 'accepted');
                        if (offer) {
                          return (
                            <button
                              className="px-3 py-1 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                              onClick={e => { e.preventDefault(); handlePayNow(offer); }}
                            >
                              Pay Now
                            </button>
                          );
                        }
                        return (
                          <button className="px-3 py-1 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">
                            View Details
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Completed Transactions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Completed Transactions</h2>
        </div>
        {transactions.filter(t => t.status === 'completed').length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No completed transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.filter(t => t.status === 'completed').map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/retailer/transaction/${txn.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">{cropNames[txn.crop_id] || txn.crop_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{farmerNames[txn.farmer_id] || txn.farmer_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${(txn.price * (cropQuantities[txn.crop_id] || 1)).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(txn.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Payment Transactions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <h2 className="text-xl font-semibold text-yellow-800">Pending Payments</h2>
        </div>
        {transactions.filter(t => t.status === 'pending_payment').length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No pending payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.filter(t => t.status === 'pending_payment').map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{cropNames[txn.crop_id] || txn.crop_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{farmerNames[txn.farmer_id] || txn.farmer_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${(txn.amount * (cropQuantities[txn.crop_id] || 1)).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="px-3 py-1 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                        onClick={() => handlePayNow({ id: txn.offer_id, price: txn.amount, crop_id: txn.crop_id })}
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerDashboard;