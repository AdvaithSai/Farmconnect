import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

type FirestoreOffer = {
  id: string;
  crop_id: string;
  retailer_id: string;
  price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
};

type OfferWithCrop = {
  id: string;
  status: string;
  price: number;
  created_at: string;
  crop_id: string;
  message?: string;
  crops: {
    id: string;
    name: string;
    image_url?: string;
    quantity: number;
    unit: string;
    location: string;
    farmers: {
      id: string;
      name: string;
    } | null;
    description: string;
  };
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800'
};

const MyOffers = () => {
  const { user } = useAppStore();
  const [offers, setOffers] = useState<OfferWithCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');
  
  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch offers from Firestore
        const offersQuery = query(
          collection(db, 'offers'),
          where('retailer_id', '==', user.id),
          orderBy('created_at', 'desc')
        );
        const offersSnap = await getDocs(offersQuery);
        const offersData = offersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreOffer));
        
        // Fetch crop and farmer details for each offer
        const offersWithDetails = await Promise.all(
          offersData.map(async (offer: FirestoreOffer) => {
            try {
              // Fetch crop details
              const cropDoc = await getDocs(query(collection(db, 'crops'), where('__name__', '==', offer.crop_id)));
              let cropData: { id: string; farmer_id?: string; name: string; quantity: number; unit: string; location: string; description: string; image_url?: string } | null = null;
              if (!cropDoc.empty) {
                const docData = cropDoc.docs[0].data();
                cropData = {
                  id: cropDoc.docs[0].id,
                  farmer_id: docData.farmer_id || '',
                  name: docData.name || 'Unknown Crop',
                  quantity: docData.quantity ?? 0,
                  unit: docData.unit || '',
                  location: docData.location || '',
                  description: docData.description || '',
                  image_url: docData.image_url || undefined
                };
              }
              
              // Fetch farmer details
              let farmerData = null;
              if (cropData && cropData.farmer_id) {
                const farmerDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', cropData.farmer_id)));
                if (!farmerDoc.empty) {
                  farmerData = { id: farmerDoc.docs[0].id, ...farmerDoc.docs[0].data() };
                }
              }
              
              return {
                ...offer,
                crops: cropData ? {
                  ...cropData,
                  farmers: farmerData
                } : {
                  id: offer.crop_id,
                  name: 'Unknown Crop',
                  quantity: 0,
                  unit: '',
                  location: '',
                  description: '',
                  farmers: null
                }
              } as OfferWithCrop;
            } catch (error) {
              console.error('Error fetching offer details:', error);
              return {
                ...offer,
                crops: {
                  id: offer.crop_id,
                  name: 'Unknown Crop',
                  quantity: 0,
                  unit: '',
                  location: '',
                  description: '',
                  farmers: null
                }
              } as OfferWithCrop;
            }
          })
        );
        
        setOffers(offersWithDetails);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to load offers');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOffers();
  }, [user]);
  
  const filteredOffers = activeTab === 'all' 
    ? offers 
    : offers.filter((offer: OfferWithCrop) => offer.status === activeTab);
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Please log in to view your offers.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Offers</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'all' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('all')}
          >
            All Offers ({offers.length})
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'pending' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({offers.filter(o => o.status === 'pending').length})
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'accepted' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('accepted')}
          >
            Accepted ({offers.filter(o => o.status === 'accepted').length})
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'rejected' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({offers.filter(o => o.status === 'rejected').length})
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({offers.filter(o => o.status === 'completed').length})
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading your offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {activeTab === 'all' 
                ? "You haven't made any offers yet." 
                : `You don't have any ${activeTab} offers.`}
            </p>
            {activeTab === 'all' && (
              <Link 
                to="/retailer/dashboard" 
                className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Browse Available Crops
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
                    Farmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Offer
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
                          <Link 
                            to={`/retailer/crop/${offer.crops.id}`}
                            className="text-sm font-medium text-green-600 hover:text-green-800"
                          >
                            {offer.crops.name}
                          </Link>
                          <div className="text-sm text-gray-500">{offer.crops.quantity} {offer.crops.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{offer.crops.farmers?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{offer.crops.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${offer.price.toFixed(2)} per {offer.crops.unit}</div>
                      <div className="text-sm text-gray-500">
                        Total: ${(offer.price * offer.crops.quantity).toFixed(2)}
                      </div>
                      {offer.message && (
                        <div className="text-xs text-gray-500 mt-1">
                          "{offer.message}"
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {offer.status === 'accepted' && (
                        <Link 
                          to={`/retailer/checkout/${offer.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete Purchase
                        </Link>
                      )}
                      {offer.status === 'pending' && (
                        <span className="text-yellow-600">Waiting for response</span>
                      )}
                      {offer.status === 'rejected' && (
                        <Link 
                          to={`/retailer/crop/${offer.crops.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Make New Offer
                        </Link>
                      )}
                      {offer.status === 'completed' && (
                        <span className="text-green-600">Purchase Complete</span>
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
  );
};

export default MyOffers;