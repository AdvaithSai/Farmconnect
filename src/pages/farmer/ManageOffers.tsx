import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ThemeLoader from '../../components/ThemeLoader';
import { collection, query, where, getDocs, doc, getDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type OfferWithCrop = {
  id: string;
  status: string;
  price: number;
  created_at: string;
  crop_id: string;
  retailer_id: string;
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
  const [offers, setOffers] = useState<OfferWithCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'pending' ? 'pending' : 'all';
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>(initialTab);

  const fetchOffers = async () => {
    if (!user || user.role !== 'farmer') return;
    setIsLoading(true);
    try {
      // 1. Get all crops belonging to this farmer
      const cropsSnap = await getDocs(
        query(collection(db, 'crops'), where('farmer_id', '==', user.id))
      );
      const cropIds = cropsSnap.docs.map(d => d.id);
      const cropMap: Record<string, OfferWithCrop['crops']> = {};
      cropsSnap.docs.forEach(d => {
        const data = d.data();
        cropMap[d.id] = {
          name: data.name || '',
          image_url: data.image_url ?? undefined,
          quantity: data.quantity ?? 0,
          unit: data.unit || '',
          price_expectation: data.price_expectation ?? undefined,
        };
      });

      if (cropIds.length === 0) {
        setOffers([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch all offers for those crops
      // Firestore 'in' queries support up to 30 items; chunk if needed
      const chunkSize = 30;
      const offerDocs: QueryDocumentSnapshot<DocumentData>[] = [];
      for (let i = 0; i < cropIds.length; i += chunkSize) {
        const chunk = cropIds.slice(i, i + chunkSize);
        const snap = await getDocs(
          query(collection(db, 'offers'), where('crop_id', 'in', chunk))
        );
        offerDocs.push(...snap.docs);
      }

      // 3. Fetch retailer details for each unique retailer_id
      const uniqueRetailerIds = Array.from(new Set(offerDocs.map(d => d.data().retailer_id as string)));
      const retailerMap: Record<string, { name: string; email: string }> = {};
      await Promise.all(
        uniqueRetailerIds.map(async (rid) => {
          try {
            const retailerSnap = await getDoc(doc(db, 'users', rid));
            if (retailerSnap.exists()) {
              const data = retailerSnap.data();
              retailerMap[rid] = { name: data.name || 'Unknown', email: data.email || '' };
            } else {
              retailerMap[rid] = { name: 'Unknown', email: '' };
            }
          } catch {
            retailerMap[rid] = { name: 'Unknown', email: '' };
          }
        })
      );

      // 4. Assemble the final offer list
      const assembled: OfferWithCrop[] = offerDocs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          status: data.status,
          price: data.price,
          created_at: data.created_at,
          crop_id: data.crop_id,
          retailer_id: data.retailer_id,
          crops: cropMap[data.crop_id] || { name: 'Unknown', quantity: 0, unit: '' },
          retailers: retailerMap[data.retailer_id] || null,
        };
      });

      // Sort by newest first
      assembled.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOffers(assembled);
    } catch (err) {
      console.error('Error fetching offers:', err);
      toast.error('Failed to load offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRespondToOffer = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await respondToOffer(offerId, newStatus);
      if (error) {
        const errorMsg =
          typeof error === 'object' && error !== null && 'message' in error &&
          typeof (error as { message?: string }).message === 'string'
            ? (error as { message: string }).message
            : 'Failed to update offer';
        toast.error(errorMsg);
      } else {
        toast.success(`Offer ${newStatus} successfully`);
        // Re-fetch so the status badge updates immediately
        await fetchOffers();
      }
    } catch (error) {
      console.error('Error responding to offer:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const filteredOffers = activeTab === 'pending'
    ? offers.filter(offer => offer.status === 'pending')
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
          <h2 className="text-xl font-semibold text-gray-800">
            Offers for Your Crops
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredOffers.length} {activeTab === 'pending' ? 'pending' : 'total'})
              </span>
            )}
          </h2>

          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Expected Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOffers.map((offer) => (
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
                          <div className="text-sm font-medium text-gray-900">
                            ₹{offer.price.toFixed(2)} per {offer.crops.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: ₹{(offer.price * offer.crops.quantity).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {offer.crops.price_expectation
                              ? `₹${offer.crops.price_expectation.toFixed(2)} per ${offer.crops.unit}`
                              : 'Not set'}
                          </div>
                          {offer.crops.price_expectation && (
                            <div className="text-sm">
                              {offer.price >= offer.crops.price_expectation
                                ? <span className="text-green-600">Above expected ✓</span>
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[String(offer.status)] || 'bg-gray-100 text-gray-800'}`}>
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {offer.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRespondToOffer(offer.id, 'accepted')}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Accept Offer"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleRespondToOffer(offer.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Reject Offer"
                              >
                                <XCircle size={20} />
                              </button>
                            </div>
                          )}
                          {offer.status !== 'pending' && (
                            <span className="text-gray-400 text-xs">—</span>
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