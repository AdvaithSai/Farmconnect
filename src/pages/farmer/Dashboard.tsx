import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, ShoppingCart, MessageCircle, X, User, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
// TODO: Implement crops and offers fetching with Firebase Firestore.

type Crop = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price_expectation?: number | null;
  location: string;
  harvest_date: string;
  image_url?: string | null;
  status: string;
  created_at: string; // Added created_at for sorting
};

const statusColors: { [key: string]: string } = {
  available: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-blue-100 text-blue-800'
};

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user, crops, loading, fetchCrops, userOffers, fetchUserOffers, respondToOffer, farmerTransactions, fetchFarmerTransactions } = useAppStore();
  const [stats, setStats] = useState({
    totalCrops: 0,
    availableCrops: 0,
    pendingOffers: 0,
    completedSales: 0
  });
  const [retailerNames, setRetailerNames] = useState<{ [id: string]: string }>({});
  // Replace separate filter and offersFilter states with a single dashboardFilter state
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'available' | 'pending' | 'sold'>('all');
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    salesOverTime: [] as Array<{ date: string; sales: number; fullDate: string }>,
    topSellingCrops: [] as Array<{ name: string; revenue: number; quantity: number; unit: string }>,
    averagePrices: [] as Array<{ name: string; averagePrice: number; unit: string; totalSales: number }>,
    retailerBreakdown: [] as Array<{ name: string; value: number; transactions: number }>,
    seasonalRevenue: [] as Array<{ season: string; revenue: number; count: number }>
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  // Dropdown expansion states
  const [showAllCrops, setShowAllCrops] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    fetchCrops();
    fetchUserOffers();
    fetchFarmerTransactions();
  }, [user, fetchCrops, fetchUserOffers, fetchFarmerTransactions]);

  // Process analytics data when crops or transactions change
  useEffect(() => {
    if (crops.length > 0 || farmerTransactions.length > 0) {
      processAnalyticsData();
    }
  }, [crops, farmerTransactions]);

  // Process analytics data
  const processAnalyticsData = () => {
    setAnalyticsLoading(true);
    
    try {
      // Process sales over time (last 30 days)
      const salesOverTime = processSalesOverTime();
      
      // Process top selling crops
      const topSellingCrops = processTopSellingCrops();
      
      // Process average prices
      const averagePrices = processAveragePrices();
      
      // Process retailer breakdown
      const retailerBreakdown = processRetailerBreakdown();
      
      // Process seasonal revenue
      const seasonalRevenue = processSeasonalRevenue();
      
      setAnalyticsData({
        salesOverTime,
        topSellingCrops,
        averagePrices,
        retailerBreakdown,
        seasonalRevenue
      });
    } catch (error) {
      console.error('Error processing analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Process sales over time data
  const processSalesOverTime = () => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find sales for this date
      const daySales = farmerTransactions
        .filter(txn => {
          const txnDate = new Date(txn.created_at).toISOString().split('T')[0];
          return txnDate === dateStr && txn.status === 'completed';
        })
        .reduce((total, txn) => total + (txn.amount || 0), 0);
      
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales,
        fullDate: dateStr
      });
    }
    
    return last30Days;
  };

  // Process top selling crops
  const processTopSellingCrops = () => {
    const cropSales: { [key: string]: { revenue: number; quantity: number; unit: string } } = {};
    
    // Group transactions by crop through offers
    farmerTransactions
      .filter(txn => txn.status === 'completed')
      .forEach(txn => {
        // Find the offer for this transaction
        const offer = userOffers.find(o => o.id === txn.offer_id);
        if (offer) {
          const crop = crops.find(c => c.id === offer.crop_id);
          if (crop) {
            if (!cropSales[crop.name]) {
              cropSales[crop.name] = { revenue: 0, quantity: 0, unit: crop.unit };
            }
            cropSales[crop.name].revenue += txn.amount || 0;
            cropSales[crop.name].quantity += 1; // Assuming 1 transaction = 1 crop unit
          }
        }
      });
    
    // Convert to array and sort by revenue
    return Object.entries(cropSales)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        quantity: data.quantity,
        unit: data.unit
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5
  };

  // Process average prices
  const processAveragePrices = () => {
    const cropPrices: { [key: string]: { totalPrice: number; count: number; unit: string } } = {};
    
    // Group transactions by crop and calculate average price
    farmerTransactions
      .filter(txn => txn.status === 'completed')
      .forEach(txn => {
        // Find the offer for this transaction
        const offer = userOffers.find(o => o.id === txn.offer_id);
        if (offer) {
          const crop = crops.find(c => c.id === offer.crop_id);
          if (crop) {
            if (!cropPrices[crop.name]) {
              cropPrices[crop.name] = { totalPrice: 0, count: 0, unit: crop.unit };
            }
            cropPrices[crop.name].totalPrice += txn.amount || 0;
            cropPrices[crop.name].count += 1;
          }
        }
      });
    
    // Calculate averages
    return Object.entries(cropPrices)
      .map(([name, data]) => ({
        name,
        averagePrice: data.totalPrice / data.count,
        unit: data.unit,
        totalSales: data.count
      }))
      .sort((a, b) => b.averagePrice - a.averagePrice);
  };

  // Process retailer breakdown
  const processRetailerBreakdown = () => {
    const retailerData: { [key: string]: { revenue: number; transactions: number } } = {};
    
    // Group transactions by retailer through offers
    farmerTransactions
      .filter(txn => txn.status === 'completed')
      .forEach(txn => {
        // Find the offer for this transaction
        const offer = userOffers.find(o => o.id === txn.offer_id);
        if (offer) {
          const retailerName = retailerNames[offer.retailer_id] || 'Unknown Retailer';
          if (!retailerData[retailerName]) {
            retailerData[retailerName] = { revenue: 0, transactions: 0 };
          }
          retailerData[retailerName].revenue += txn.amount || 0;
          retailerData[retailerName].transactions += 1;
        }
      });
    
    // Convert to array for pie chart
    return Object.entries(retailerData)
      .map(([name, data]) => ({
        name,
        value: data.revenue,
        transactions: data.transactions
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Process seasonal revenue
  const processSeasonalRevenue = () => {
    const seasonalData: { [key: string]: { revenue: number; count: number } } = {
      'Spring': { revenue: 0, count: 0 },
      'Summer': { revenue: 0, count: 0 },
      'Autumn': { revenue: 0, count: 0 },
      'Winter': { revenue: 0, count: 0 }
    };
    
    // Group transactions by season
    farmerTransactions
      .filter(txn => txn.status === 'completed')
      .forEach(txn => {
        const transactionDate = new Date(txn.created_at);
        const month = transactionDate.getMonth();
        let season: keyof typeof seasonalData = 'Spring';
        
        if (month >= 2 && month <= 4) season = 'Spring';
        else if (month >= 5 && month <= 7) season = 'Summer';
        else if (month >= 8 && month <= 10) season = 'Autumn';
        else season = 'Winter';
        
        seasonalData[season].revenue += txn.amount || 0;
        seasonalData[season].count += 1;
      });
    
    // Convert to array
    return Object.entries(seasonalData)
      .map(([season, data]) => ({
        season,
        revenue: data.revenue,
        count: data.count
      }));
  };

  useEffect(() => {
    // Update stats when crops change
    setStats({
      totalCrops: crops.length,
      availableCrops: crops.filter(c => c.status === 'available').length,
      pendingOffers: 0, // Placeholder, update if offers are implemented
      completedSales: crops.filter(c => c.status === 'sold').length
    });
  }, [crops]);

  // Fetch retailer names for offers
  useEffect(() => {
    const fetchRetailerNames = async () => {
      const uniqueRetailerIds = Array.from(new Set(userOffers.map(o => o.retailer_id)));
      const names: { [id: string]: string } = {};
      await Promise.all(uniqueRetailerIds.map(async (id) => {
        if (!id) return;
        try {
          const retailerDoc = await getDoc(doc(db, 'users', id));
          if (retailerDoc.exists()) {
            const data = retailerDoc.data();
            names[id] = data.name || id;
          } else {
            names[id] = id;
          }
        } catch {
          names[id] = id;
        }
      }));
      setRetailerNames(names);
    };
    if (userOffers.length > 0) fetchRetailerNames();
  }, [userOffers]);

  // Helper to get crop name from crop_id
  const getCropName = (crop_id: string) => {
    const crop = crops.find(c => c.id === crop_id);
    return crop ? crop.name : crop_id;
  };

  // Handler for accepting/rejecting offers
  const handleRespondToOffer = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    const { error } = await respondToOffer(offerId, newStatus);
    if (error) {
      toast.error('Failed to update offer status');
    } else {
      toast.success(`Offer ${newStatus}`);
    }
  };

  // Handler for opening chat with retailer
  const handleOpenChat = (offer: { retailer_id: string; crop_id: string }) => {
    console.log('Navigating to chat with:', { retailerId: offer.retailer_id, cropId: offer.crop_id });
    if (!offer.retailer_id || !offer.crop_id) {
      console.warn('Cannot navigate to chat: missing retailer_id or crop_id', offer);
      return;
    }
    // Navigate to chats page with the specific retailer
    navigate(`/farmer/chats?retailer=${offer.retailer_id}&crop=${offer.crop_id}`);
  };

  // Filter crops based on current filter
  const filteredCrops = crops.filter(crop => {
    if (dashboardFilter === 'all') return true;
    return crop.status === dashboardFilter;
  });

  // Get filter title and description
  const getFilterInfo = () => {
    switch (dashboardFilter) {
      case 'available':
        return {
          title: 'Available Crops',
          description: `Showing ${filteredCrops.length} available crops for sale`
        };
      case 'pending':
        return {
          title: 'Pending Offers',
          description: `Showing ${filteredCrops.length} pending offers`
        };
      case 'sold':
        return {
          title: 'Completed Sales',
          description: `Showing ${filteredCrops.length} completed sales`
        };
      default:
        return {
          title: 'Your Crops',
          description: `Showing all ${filteredCrops.length} crops`
        };
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Please log in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link
            to="/farmer/chats"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <MessageCircle size={20} className="mr-2" />
            Messages
          </Link>
          <Link
            to="/farmer/add-crop"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add New Crop
          </Link>
          <Link
            to="/profile"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <User size={20} className="mr-2" />
            Profile
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div 
          className={`rounded-lg shadow-md p-4 min-h-[120px] min-w-[160px] cursor-pointer hover:shadow-lg transition-all ${
            dashboardFilter === 'all' 
              ? 'bg-green-50 border-2 border-green-200 shadow-lg' 
              : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => setDashboardFilter('all')}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full mr-6 ${
              dashboardFilter === 'all' ? 'bg-green-200 text-green-700' : 'bg-green-100 text-green-600'
            }`}>
              <ShoppingCart size={36} />
            </div>
            <div>
              <p className={`text-sm ${dashboardFilter === 'all' ? 'text-green-700' : 'text-gray-600'}`}>Total Crops</p>
              <p className={`text-2xl font-bold ${dashboardFilter === 'all' ? 'text-green-800' : 'text-gray-900'}`}>{stats.totalCrops}</p>
            </div>
          </div>
        </div>
        <div 
          className={`rounded-lg shadow-md p-4 min-h-[120px] min-w-[160px] cursor-pointer hover:shadow-lg transition-all ${
            dashboardFilter === 'available' 
              ? 'bg-green-50 border-2 border-green-200 shadow-lg' 
              : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => setDashboardFilter('available')}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full mr-6 ${
              dashboardFilter === 'available' ? 'bg-green-200 text-green-700' : 'bg-green-100 text-green-600'
            }`}>
              <CheckCircle2 size={36} />
            </div>
            <div>
              <p className={`text-lg ${dashboardFilter === 'available' ? 'text-green-700' : 'text-gray-600'}`}>Available Crops</p>
              <p className={`text-4xl font-bold ${dashboardFilter === 'available' ? 'text-green-800' : 'text-gray-900'}`}>{stats.availableCrops}</p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-lg shadow-md p-4 min-h-[120px] min-w-[160px] cursor-pointer hover:shadow-lg transition-all ${
            dashboardFilter === 'pending'
              ? 'bg-yellow-50 border-2 border-yellow-200 shadow-lg'
              : 'bg-white hover:bg-yellow-50'
          }`}
          onClick={() => setDashboardFilter('pending')}
        >
          <div className="flex items-center">
            <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mr-6">
              <Clock size={36} />
            </div>
            <div>
              <p className="text-lg text-yellow-600">Pending Offers</p>
              <p className="text-4xl font-bold">{crops.filter(c => c.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div 
          className={`rounded-lg shadow-md p-4 min-h-[120px] min-w-[160px] cursor-pointer hover:shadow-lg transition-all ${
            dashboardFilter === 'sold' 
              ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' 
              : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => setDashboardFilter('sold')}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full mr-6 ${
              dashboardFilter === 'sold' ? 'bg-blue-200 text-blue-700' : 'bg-blue-100 text-blue-600'
            }`}>
              <CheckCircle2 size={36} />
            </div>
            <div>
              <p className={`text-lg ${dashboardFilter === 'sold' ? 'text-blue-700' : 'text-gray-600'}`}>Completed Sales</p>
              <p className={`text-4xl font-bold ${dashboardFilter === 'sold' ? 'text-blue-800' : 'text-gray-900'}`}>{stats.completedSales}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Your Crops */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{getFilterInfo().title}</h2>
              <p className="text-sm text-gray-600">
                {getFilterInfo().description}
                {filteredCrops.length > 5 && (
                  <span className="ml-2 text-green-600 font-medium">
                    Showing latest {showAllCrops ? filteredCrops.length : 5} of {filteredCrops.length}
                  </span>
                )}
                {filteredCrops.length > 5 && !showAllCrops && (
                  <span className="block mt-1 text-xs text-gray-500">
                    (Most recent crops shown first)
                  </span>
                )}
              </p>
            </div>
            {dashboardFilter !== 'all' && (
              <button
                onClick={() => setDashboardFilter('all')}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <X size={16} className="mr-1" />
                Clear Filter
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading your crops...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">
              {dashboardFilter === 'available' 
                ? "You don't have any available crops for sale." 
                : dashboardFilter === 'pending' 
                ? "You don't have any pending offers."
                : dashboardFilter === 'sold' 
                ? "You don't have any completed sales yet."
                : "You haven't listed any crops yet."
              }
            </p>
            {dashboardFilter === 'all' && (
              <Link
                to="/farmer/add-crop"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Add Your First Crop
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harvest Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showAllCrops ? filteredCrops : filteredCrops
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                ).map((crop: Crop) => (
                  <tr key={crop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {crop.image_url ? (
                          <img 
                            src={crop.image_url} 
                            alt={crop.name} 
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold">{crop.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{crop.name}</div>
                          <div className="text-sm text-gray-500">{crop.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{crop.quantity} {crop.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${crop.price_expectation?.toFixed(2) || 'Not set'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(crop.harvest_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[String(crop.status)]}`}>
                        {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Show More/Less Toggle for Crops */}
            {filteredCrops.length > 5 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAllCrops(!showAllCrops)}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  {showAllCrops ? (
                    <>
                      <span>Show Less</span>
                      <svg className="w-4 h-4 ml-2 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show All ({filteredCrops.length - 5} more)</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Offers for Your Crops */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Offers for Your Crops</h2>
            <p className="text-sm text-gray-600">
              {userOffers.length > 5 && (
                <span className="text-green-600 font-medium">
                  Showing latest {showAllOffers ? userOffers.length : 5} of {userOffers.length}
                </span>
              )}
              {userOffers.length <= 5 && (
                <span>All {userOffers.length} offers</span>
              )}
              {userOffers.length > 5 && !showAllOffers && (
                <span className="block mt-1 text-xs text-gray-500">
                  (Most recent offers shown first)
                </span>
              )}
            </p>
          </div>
          {dashboardFilter !== 'all' && (
            <button
              onClick={() => setDashboardFilter('all')}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X size={16} className="mr-1" />
              Clear Filter
            </button>
          )}
        </div>
        {userOffers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No offers have been made for your crops yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showAllOffers ? userOffers : userOffers
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                ).map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getCropName(offer.crop_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{retailerNames[offer.retailer_id] || offer.retailer_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{offer.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {offer.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespondToOffer(offer.id, 'accepted')}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondToOffer(offer.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <button
                          onClick={() => handleOpenChat(offer)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Chat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Show More/Less Toggle for Offers */}
            {userOffers.length > 5 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAllOffers(!showAllOffers)}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  {showAllOffers ? (
                    <>
                      <span>Show Less</span>
                      <svg className="w-4 h-4 ml-2 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show All ({userOffers.length - 5} more)</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 size={20} className="mr-2 text-green-600" />
                Analytics Dashboard
              </h2>
              <p className="text-sm text-gray-600">Track your sales performance and insights</p>
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Sales Over Time Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp size={18} className="mr-2 text-blue-600" />
                Total Sales Over Time (Last 30 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.salesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Selling Crops Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign size={18} className="mr-2 text-green-600" />
                Top Selling Crops by Revenue
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topSellingCrops}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => `Crop: ${label}`}
                    />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Price per Crop Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 size={18} className="mr-2 text-purple-600" />
                Average Price per Crop
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.averagePrices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Average Price']}
                      labelFormatter={(label) => `Crop: ${label}`}
                    />
                    <Bar dataKey="averagePrice" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retailer Breakdown Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar size={18} className="mr-2 text-orange-600" />
                  Retailer-wise Sales Breakdown
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.retailerBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.retailerBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Seasonal Revenue Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar size={18} className="mr-2 text-blue-600" />
                  Seasonal Revenue Insights
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.seasonalRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => `Season: ${label}`}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-blue-900">
                      ₹{analyticsData.salesOverTime.reduce((sum, day) => sum + day.sales, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign size={20} className="text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Completed Sales</p>
                    <p className="text-xl font-bold text-green-900">
                      {farmerTransactions.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 size={20} className="text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Active Crops</p>
                    <p className="text-xl font-bold text-purple-900">
                      {crops.filter(c => c.status === 'available').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Calendar size={20} className="text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Top Season</p>
                    <p className="text-xl font-bold text-orange-900">
                      {analyticsData.seasonalRevenue.length > 0 
                        ? analyticsData.seasonalRevenue.reduce((max, season) => 
                            season.revenue > max.revenue ? season : max
                          ).season
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/farmer/add-crop"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add New Crop</p>
              <p className="text-xs text-gray-500">List a new crop for sale</p>
            </div>
          </Link>
          <Link
            to="/farmer/offers?tab=pending"
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Pending Offers</p>
              <p className="text-xs text-gray-500">Check and respond to offers</p>
            </div>
          </Link>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Completed Sales</p>
              <p className="text-xs text-gray-500">You have {stats.completedSales} completed sales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;