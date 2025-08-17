import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThemeLoader from '../../components/ThemeLoader';

interface Transaction {
  id: string;
  crop_id: string;
  farmer_id: string;
  retailer_id: string;
  offer_id: string;
  price: number;
  created_at: string;
  status: string;
}

interface Offer {
  id: string;
  crop_id: string;
  retailer_id: string;
  price: number;
  status: string;
  created_at: string;
}

interface Crop {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  farmer_id: string;
}

interface Farmer {
  id: string;
  name: string;
  location?: string;
}

const TransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch transaction
        const txnDoc = await getDoc(doc(db, 'transactions', id));
        if (!txnDoc.exists()) {
          setTransaction(null);
          setLoading(false);
          return;
        }
        const txnData = { id: txnDoc.id, ...txnDoc.data() } as Transaction;
        setTransaction(txnData);

        // Fetch offer
        const offerDoc = await getDoc(doc(db, 'offers', txnData.offer_id));
        if (offerDoc.exists()) {
          setOffer({ id: offerDoc.id, ...offerDoc.data() } as Offer);
        }

        // Fetch crop
        const cropDoc = await getDoc(doc(db, 'crops', txnData.crop_id));
        if (cropDoc.exists()) {
          setCrop({ id: cropDoc.id, ...cropDoc.data() } as Crop);
        }

        // Fetch farmer
        if (txnData.farmer_id) {
          const farmerDoc = await getDoc(doc(db, 'users', txnData.farmer_id));
          if (farmerDoc.exists()) {
            setFarmer({ id: farmerDoc.id, ...farmerDoc.data() } as Farmer);
          }
        }
      } catch {
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
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

  if (!transaction || !offer || !crop || !farmer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction not found</h3>
          <p className="text-gray-500 mb-6">The transaction you're looking for does not exist.</p>
          <Link to="/retailer/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const totalPrice = offer.price * crop.quantity;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="mb-4">
          <span className="font-semibold">Crop Name:</span> {crop.name}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Farmer Name:</span> {farmer.name}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Crop Location:</span> {crop.location}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Price per {crop.unit}:</span> ${offer.price.toFixed(2)}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Quantity:</span> {crop.quantity} {crop.unit}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Total Price:</span> ${totalPrice.toFixed(2)}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Offer Initiated:</span> {new Date(offer.created_at).toLocaleString()}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Transaction Completed:</span> {new Date(transaction.created_at).toLocaleString()}
        </div>
        <div className="mt-6">
          <Link to="/retailer/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails; 