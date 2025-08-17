import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ThemeLoader from '../../components/ThemeLoader';
// TODO: Implement managing offers with Firebase Firestore.

type OfferWithCrop = {
  id: string;
  status: string;
  price: number;
  created_at: string;
  crop_id: string;
  crops: {
    name: string;
    image_url?: string;
    quantity: number;
    unit: string;
    price_expectation?: number;
  };
  retailers: {
    name: string;
    email: string;
  } | null;
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const ManageOffers = () => {
  const { user, respondToOffer } = useAppStore();
  const [offers] = useState<OfferWithCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'pending' ? 'pending' : 'all';
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>(initialTab);
  
  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;
      setIsLoading(true);
      // TODO: Fetch offers from Firebase Firestore and update state
      setIsLoading(false);
    };
    fetchOffers();
  }, [user]);
  
  const handleRespondToOffer = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await respondToOffer(offerId, newStatus);
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error && typeof (error as unknown as { message?: string }).message === 'string'
          ? (error as unknown as { message: string }).message
          : JSON.stringify(error) || 'Failed to update offer';
        toast.error(errorMsg);
      } else {
        toast.success('Offer updated successfully');
      }
    } catch (error) {
      console.error('Error responding to offer:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  const filteredOffers = activeTab === 'pending'
    ? offers.filter((offer: OfferWithCrop) => offer.status === 'pending')
    : offers;
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Please log in to access your offers.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Offers</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Offers for Your Crops</h2>
          
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm rounded-md ${activeTab === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md ${activeTab === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveTab('all')}
            >
              All Offers
            </button>
          </div>
        </div>
        
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <ThemeLoader />
            </div>
          )}
          <div className={isLoading ? 'blur-sm pointer-events-none select-none opacity-60 transition-all duration-300' : ''}>
            {filteredOffers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {activeTab === 'pending' 
                    ? "You don't have any pending offers at the moment." 
                    : "You haven't received any offers yet."}
                </p>
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
                        Retailer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Offer Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Expected Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOffers.map((offer: OfferWithCrop) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {offer.crops.image_url ? (
                              <img 
                                src={offer.crops.image_url} 
                                alt={offer.crops.name} 
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                <span className="text-green-600 font-bold">{offer.crops.name.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{offer.crops.name}</div>
                              <div className="text-sm text-gray-500">{offer.crops.quantity} {offer.crops.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{offer.retailers?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{offer.retailers?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${offer.price.toFixed(2)} per {offer.crops.unit}</div>
                          <div className="text-sm text-gray-500">
                            Total: ${(offer.price * offer.crops.quantity).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${offer.crops.price_expectation?.toFixed(2) || 'Not set'} per {offer.crops.unit}
                          </div>
                          {offer.crops.price_expectation && (
                            <div className="text-sm text-gray-500">
                              {offer.price >= (offer.crops.price_expectation || 0) 
                                ? <span className="text-green-600">Above expected</span>
                                : <span className="text-red-600">Below expected</span>
                              }
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(offer.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[String(offer.status)]}`}>
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {offer.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRespondToOffer(offer.id, 'accepted')}
                                className="text-green-600 hover:text-green-900"
                                title="Accept Offer"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleRespondToOffer(offer.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="Reject Offer"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                          {offer.status !== 'pending' && (
                            <span className="text-gray-500">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOffers;