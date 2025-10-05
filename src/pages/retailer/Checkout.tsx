import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../lib/store';

// Mock payment method data (in a real app, this would come from a payment processor)
const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'bank', name: 'Bank Transfer', icon: CreditCard }
];

// Razorpay response type for handler
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// TODO: Implement checkout and payment logic with Firebase Firestore.

type Offer = {
  id: string;
  price: number;
  crop_id: string;
  crops: {
    name: string;
    image_url?: string;
    quantity: number;
    unit: string;
  };
  farmers: { name: string }[];
};

const Checkout = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) return;
      setIsLoading(true);
      try {
        // Example: Fetch offer from Firestore (replace with your actual logic)
        const res = await fetch(`http://localhost:3000/get-offer/${offerId}`);
        const data = await res.json();
        if (data.success && data.offer) {
          setOffer(data.offer);
        } else {
          setOffer(null);
        }
      } catch (error) {
        setOffer(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffer();
  }, [offerId]);
  
  const handleCheckout = async () => {
    if (!offer) return;
    setIsProcessing(true);
    try {
      // Fetch Razorpay Key ID from backend
      const keyRes = await fetch('http://localhost:3000/razorpay-key');
      const keyData = await keyRes.json();
      const keyId = keyData.key;
      
      const res = await fetch('http://localhost:3000/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: offer.price * offer.crops.quantity,
          receipt: offer.id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error('Failed to create order');
        setIsProcessing(false);
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
          try {
            console.log('Razorpay payment handler called. User:', useAppStore.getState().user);
            // Mark transaction as completed (backend)
            const txnRes = await fetch('http://localhost:3000/mark-transaction-completed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: offer.id }),
            });
            if (!txnRes.ok) {
              console.error('mark-transaction-completed failed:', txnRes.status, await txnRes.text());
              toast.error('Failed to mark transaction as completed.');
            }
            console.log('User state after mark-transaction-completed:', useAppStore.getState().user);

            // Mark crop as sold (backend)
            // Use your deployed Firebase Function URL here
            const cropRes = await fetch('https://us-central1-farmer-d3cc7.cloudfunctions.net/markCropSold', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cropId: offer.crop_id }),
            });
            if (!cropRes.ok) {
              console.error('mark-crop-sold failed:', cropRes.status, await cropRes.text());
              toast.error('Failed to mark crop as sold.');
            }
            const cropResult = await cropRes.json().catch(() => ({}));
            console.log('Crop mark as sold result:', cropResult);
            console.log('User state after mark-crop-sold:', useAppStore.getState().user);
            if (!cropResult.success) {
              toast.error('Failed to mark crop as sold.');
            }

            toast.success('Payment successful! Payment ID: ' + response.razorpay_payment_id);

            // Refresh all data globally
            await useAppStore.getState().refreshAllData();
            console.log('User state after refreshAllData:', useAppStore.getState().user);

            // Refetch offer to update UI
            const res = await fetch(`http://localhost:3000/get-offer/${offer.id}`);
            if (!res.ok) {
              console.error('get-offer failed:', res.status, await res.text());
              toast.error('Failed to refetch offer.');
            }
            const data = await res.json().catch(() => ({}));
            if (data.success && data.offer) {
              setOffer(data.offer);
              console.log('Offer after payment:', data.offer);
            } else {
              console.error('Offer not found or error in response:', data);
            }

            // Show success screen
            setIsSuccess(true);

            // Debug: log user state after payment
            setTimeout(() => {
              console.log('User state after payment (timeout):', useAppStore.getState().user);
            }, 1000);
          } catch (error) {
            console.error('Error updating transaction/crop status:', error);
            toast.error('Payment succeeded but failed to update transaction/crop status. Please contact support.');
            console.log('User state after error:', useAppStore.getState().user);
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: { color: '#3399cc' },
        redirect: false,
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading checkout...</p>
        </div>
      </div>
    );
  }
  
  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Offer not found</h3>
          <p className="text-gray-500 mb-6">
            The offer you're trying to checkout doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/retailer/offers')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to My Offers
          </button>
        </div>
      </div>
    );
  }
  
  const totalAmount = offer.price * offer.crops.quantity;
  
  // Success Screen
  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of ${totalAmount.toFixed(2)} has been processed successfully.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Crop:</span>
                <span className="text-gray-900 font-medium">{offer.crops.name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Quantity:</span>
                <span className="text-gray-900">{offer.crops.quantity} {offer.crops.unit}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Price per {offer.crops.unit}:</span>
                <span className="text-gray-900">${offer.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-800 font-medium">Total:</span>
                <span className="text-green-600 font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate('/retailer/dashboard')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Browse More Crops
              </button>
              <button
                onClick={() => navigate('/retailer/offers')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                View My Offers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Checkout Screen
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/retailer/offers')}
        className="flex items-center text-green-600 hover:text-green-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" />
        <span>Back to My Offers</span>
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              {offer.crops.image_url ? (
                <img 
                  src={offer.crops.image_url} 
                  alt={offer.crops.name} 
                  className="h-16 w-16 rounded-md object-cover mr-4"
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-green-100 flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold text-xl">{offer.crops.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{offer.crops.name}</h3>
                <p className="text-gray-600">
                  {offer.crops.quantity} {offer.crops.unit} from {offer.farmers[0]?.name || 'Unknown Farmer'}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Price per {offer.crops.unit}:</span>
                <span className="text-gray-900">${offer.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Quantity:</span>
                <span className="text-gray-900">{offer.crops.quantity} {offer.crops.unit}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-800 font-medium">Total:</span>
                <span className="text-green-600 font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Payment Method</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className={`border rounded-md p-4 flex items-center cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                    selectedPaymentMethod === method.id 
                      ? 'border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    )}
                  </div>
                  <method.icon size={24} className="text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">{method.name}</span>
                </div>
              ))}
            </div>
            
            {/* Mock payment form - would be replaced by actual payment gateway UI */}
            {selectedPaymentMethod === 'card' && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                    placeholder="4242 4242 4242 4242"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                      placeholder="MM/YY"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                      placeholder="123"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {selectedPaymentMethod === 'bank' && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    id="accountName"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                    placeholder="1234567890"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    id="routingNumber"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                    placeholder="123456789"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Total Amount: <span className="font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
          </p>
          <button
            onClick={handleCheckout}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Purchase'}
          </button>
        </div>
        
        <p className="mt-4 text-sm text-gray-500 text-center">
          This is a demo application. No actual payment will be processed.
        </p>
      </div>
    </div>
  );
};

export default Checkout;