import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User, MapPin, Calendar, Info, DollarSign, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ThemeLoader from '../../components/ThemeLoader';
// TODO: Implement crop and offer details fetching with Firebase Firestore.

type CropWithFarmer = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price_expectation?: number;
  location: string;
  harvest_date: string;
  image_url?: string;
  status: string;
  farmers: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  } | null;
};

type OfferRow = {
  id: string;
  price: number;
  created_at: string;
  status: string;
  crop_id: string;
  retailer_id: string;
};

type OfferFormData = {
  price: number;
  message: string;
};

const CropDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, makeOffer } = useAppStore();
  
  const [crop, setCrop] = useState<CropWithFarmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingOffer, setExistingOffer] = useState<OfferRow | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerData, setOfferData] = useState<OfferFormData>({
    price: 0,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchCropDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // Fetch crop by ID from Firestore
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const cropDoc = await getDoc(doc(db, 'crops', id));
        if (!cropDoc.exists()) {
          setIsLoading(false);
          setCrop(null);
          return;
        }
        const cropData = cropDoc.data();
        // Optionally fetch farmer info
        let farmer = null;
        if (cropData.farmer_id) {
          const farmerDoc = await getDoc(doc(db, 'users', cropData.farmer_id));
          if (farmerDoc.exists()) {
            const farmerData = farmerDoc.data();
            farmer = { id: farmerDoc.id, ...(farmerData as { name: string; email: string; phone: string | null; address: string | null; }) };
          }
        }
        setCrop({
          ...cropData,
          id: cropDoc.id,
          farmers: farmer,
        } as CropWithFarmer);
      } catch (error) {
        console.error('Error fetching crop details:', error);
        toast.error('Failed to load crop details');
        setCrop(null);
      }
      setIsLoading(false);
    };
    fetchCropDetails();
  }, [id, user]);
  
  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop) return;
    setIsSubmitting(true);
    try {
      const { error, offer } = await makeOffer({
        crop_id: crop.id,
        price: offerData.price,
        message: offerData.message,
      });
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error && typeof (error as unknown as { message?: string }).message === 'string'
          ? (error as unknown as { message: string }).message
          : JSON.stringify(error) || 'Failed to submit offer';
        toast.error(errorMsg);
      } else {
        toast.success('Your offer has been submitted!');
        setExistingOffer(offer);
        setShowOfferForm(false);
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 relative">
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <ThemeLoader />
        </div>
        <div className="blur-sm pointer-events-none select-none opacity-60 transition-all duration-300">
          {/* Optionally, you can show a skeleton or keep the structure here */}
        </div>
      </div>
    );
  }
  
  if (!crop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Crop not found</h3>
          <p className="text-gray-500 mb-6">
            The crop you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/retailer/dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/retailer/dashboard')}
        className="flex items-center text-green-600 hover:text-green-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        <span>Back to Crops</span>
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="md:flex">
          {/* Crop Image */}
          <div className="md:w-1/3 h-64 md:h-auto bg-green-100">
            {crop.image_url ? (
              <img 
                src={crop.image_url} 
                alt={crop.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-green-600 text-6xl font-bold">{crop.name.charAt(0)}</span>
              </div>
            )}
          </div>
          
          {/* Crop Details */}
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{crop.name}</h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin size={16} className="mr-1" />
                  <span>{crop.location}</span>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
              </span>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600">{crop.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Details</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Info size={16} className="mr-2 text-green-600 mt-1" />
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">{crop.quantity} {crop.unit}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Calendar size={16} className="mr-2 text-green-600 mt-1" />
                    <div>
                      <span className="text-gray-600">Harvest Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(crop.harvest_date).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <DollarSign size={16} className="mr-2 text-green-600 mt-1" />
                    <div>
                      <span className="text-gray-600">Expected Price:</span>
                      <span className="ml-2 font-medium">
                        ${crop.price_expectation?.toFixed(2) || 'Negotiable'} per {crop.unit}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Farmer Information</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <User size={16} className="mr-2 text-green-600 mt-1" />
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{crop.farmers?.name || 'Unknown'}</span>
                    </div>
                  </li>
                  {crop.farmers?.phone && (
                    <li className="flex items-start">
                      <span className="text-gray-600 ml-6">Phone:</span>
                      <span className="ml-2 font-medium">{crop.farmers.phone}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Action Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {existingOffer ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">Your Offer</h3>
                  <p className="text-yellow-700 mb-2">
                    You've offered <span className="font-bold">${existingOffer.price.toFixed(2)}</span> per {crop.unit}
                    for this crop on {new Date(existingOffer.created_at).toLocaleDateString()}.
                  </p>
                  <p className="text-yellow-700">
                    Status: <span className="font-semibold">{existingOffer.status.charAt(0).toUpperCase() + existingOffer.status.slice(1)}</span>
                  </p>
                  
                  {existingOffer.status === 'accepted' && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/retailer/checkout/${existingOffer.id}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {showOfferForm ? (
                    <form onSubmit={handleSubmitOffer}>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Make an Offer</h3>
                      
                      <div className="mb-4">
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Offer Price (per {crop.unit})
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            min="0.01"
                            step="0.01"
                            required
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00"
                            value={offerData.price || ''}
                            onChange={handleOfferChange}
                            disabled={isSubmitting}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">per {crop.unit}</span>
                          </div>
                        </div>
                        {crop.price_expectation && (
                          <p className="mt-1 text-sm text-gray-500">
                            Farmer's expected price: ${crop.price_expectation.toFixed(2)} per {crop.unit}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Message to Farmer (Optional)
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={3}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Add any details about your offer or questions for the farmer"
                          value={offerData.message}
                          onChange={handleOfferChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={() => setShowOfferForm(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-600 mb-2">
                          Interested in this crop? Make an offer to the farmer.
                        </p>
                        <p className="text-sm text-gray-500">
                          Total Value: ${((crop.price_expectation || 0) * crop.quantity).toFixed(2)}
                          {!crop.price_expectation && ' (Based on your offer)'}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            console.log('Navigating to chat with:', { cropId: crop.id, farmerId: crop.farmers?.id });
                            if (!crop.id || !crop.farmers?.id) {
                              console.warn('Cannot navigate to chat: missing crop.id or crop.farmers.id', crop);
                              return;
                            }
                            navigate(`/retailer/chats?crop=${crop.id}&farmer=${crop.farmers.id}`);
                          }}
                          className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors flex items-center"
                        >
                          <MessageCircle size={16} className="mr-2" />
                          Chat with Farmer
                        </button>
                        <button
                          onClick={() => setShowOfferForm(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Make an Offer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetails;