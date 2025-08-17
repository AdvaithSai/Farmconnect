import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Check, CheckCheck, MapPin } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';
import { doc, setDoc, collection, query, where, orderBy, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LocationTracker from './LocationTracker';

// Declare Razorpay types for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  offer_id: string | null;
  price: number | null;
  created_at: string;
  deliveredTo?: string[];
  readBy?: string[];
}

interface ChatProps {
  chatId: string;
  otherUserName: string;
  cropName: string;
}

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

const Chat: React.FC<ChatProps> = ({ chatId, otherUserName, cropName }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [price, setPrice] = useState('');
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [showLocationTracker, setShowLocationTracker] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, sendMessage, updateOfferPrice, currentChat, userOffers } = useAppStore();

  // Real-time listener for messages in this chat
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('chat_id', '==', chatId),
      orderBy('created_at', 'asc')
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      // Delivery receipt: mark as delivered for messages not sent by this user
      if (user) {
        for (const msg of msgs) {
          if (msg.sender_id !== user.id && (!msg.deliveredTo || !msg.deliveredTo.includes(user.id))) {
            await updateDoc(doc(db, 'messages', msg.id), {
              deliveredTo: arrayUnion(user.id)
            });
          }
        }
      }
    });
    return () => unsubscribe();
  }, [chatId, user]);

  // Mark all messages from the other user as read for this chat in Firestore
  useEffect(() => {
    if (messages.length > 0 && user) {
      const otherUserId = messages.find(msg => msg.sender_id !== user.id)?.sender_id;
      const latestOtherMsg = [...messages].reverse().find(msg => msg.sender_id === otherUserId);
      if (latestOtherMsg) {
        setDoc(doc(db, 'chat_reads', `${chatId}_${user.id}`), {
          chat_id: chatId,
          user_id: user.id,
          last_read_at: latestOtherMsg.created_at,
        });
      }
      // Read receipt: mark as read for all messages not sent by this user
      for (const msg of messages) {
        if (msg.sender_id !== user.id && (!msg.readBy || !msg.readBy.includes(user.id))) {
          updateDoc(doc(db, 'messages', msg.id), {
            readBy: arrayUnion(user.id)
          });
        }
      }
    }
    scrollToBottom();
  }, [messages, user, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setIsLoading(true);
    try {
      // Just use the original sendMessage signature
      const { error } = await sendMessage(chatId, message.trim());
      if (error) {
        toast.error('Failed to send message');
      } else {
        setMessage('');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price.trim() || !user) return;
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Enter a valid price.');
      return;
    }
    setIsPriceLoading(true);
    try {
      // Find the offer for this crop and retailer
      const cropId = currentChat?.crop_id;
      const retailerId = user.id;
      if (!cropId || !retailerId) {
        toast.error('Missing crop or retailer info.');
        setIsPriceLoading(false);
        return;
      }
      // Get userOffers from the store
      const offers = useAppStore.getState().userOffers;
      const offer = offers.find(o => o.crop_id === cropId && o.retailer_id === retailerId && o.status === 'pending');
      if (!offer) {
        toast.error('No pending offer found for this crop.');
        setIsPriceLoading(false);
        return;
      }
      const offerId = offer.id;
      // Call updateOfferPrice
      const { error } = await updateOfferPrice(offerId, priceValue);
      if (error) {
        toast.error('Failed to update offer price');
      } else {
        toast.success('Price updated and farmer notified!');
        setPrice('');
      }
    } catch {
      toast.error('Failed to update offer price');
    } finally {
      setIsPriceLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (senderId: string) => {
    return senderId === user?.id;
  };

  // Render message status icon for current user's messages
  const renderStatusIcon = (msg: Message) => {
    if (!isOwnMessage(msg.sender_id)) return null;
    // const otherUserId = user?.role === 'farmer' ? msg.chat_id.split('_')[1] : msg.chat_id.split('_')[0];
    // If all recipients have read
    if (msg.readBy && msg.readBy.length > 1) {
      return <CheckCheck size={16} className="inline ml-1 text-blue-500" />;
    }
    // If delivered to recipient
    if (msg.deliveredTo && msg.deliveredTo.length > 1) {
      return <CheckCheck size={16} className="inline ml-1 text-gray-500" />;
    }
    // Sent only
    return <Check size={16} className="inline ml-1 text-gray-400" />;
  };

  // Razorpay payment handler
  const handlePayNow = async (offer: { id: string; price: number }) => {
    try {
      // Fetch Razorpay Key ID from backend
      const keyRes = await fetch('http://localhost:3000/razorpay-key');
      if (!keyRes.ok) {
        console.error('Failed to get Razorpay key with status:', keyRes.status);
        toast.error('Failed to connect to payment server. Please ensure the backend is running.');
        return;
      }
      
      const keyData = await keyRes.json();
      console.log('Razorpay key response:', keyData);
      
      if (!keyData.success || !keyData.key) {
        console.error('Invalid Razorpay key response:', keyData);
        toast.error(`Payment configuration error: ${keyData.error || 'Invalid key response'}`);
        return;
      }
      
      const keyId = keyData.key;
      
      console.log('Creating order with price:', offer.price, 'and receipt ID:', offer.id);
      const res = await fetch('http://localhost:3000/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: offer.price,
          receipt: offer.id,
        }),
      });
      
      if (!res.ok) {
        console.error('Order creation failed with status:', res.status);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        toast.error('Failed to create order. Please try again.');
        return;
      }
      
      const data = await res.json();
      console.log('Order creation response:', data);
      
      // Check if the response contains the expected data structure
      if (!data.success || !data.order) {
        console.error('Order creation failed or invalid response:', data);
        toast.error(`Failed to create order: ${data.error || 'Invalid response from server'}`);
        return;
      }
      
      // Log the order details for debugging
      console.log('Order details:', {
        id: data.order.id,
        amount: data.order.amount,
        currency: data.order.currency || 'INR'
      });
      
      // Initialize Razorpay options with the order data
      const options = {
        key: keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'FarmConnect',
        description: 'Crop Payment',
        order_id: data.order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            // Find the transaction for this offer
            const { userOffers } = useAppStore.getState();
            const currentOffer = userOffers.find(o => o.id === offer.id);
            if (!currentOffer) {
              alert('Offer not found. Please refresh the page.');
              return;
            }
            
            // Mark transaction as completed
            const txnRes = await fetch('http://localhost:3000/mark-transaction-completed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: currentOffer.id }),
            });
            
            if (!txnRes.ok) {
              throw new Error('Failed to mark transaction as completed');
            }
            
            // Mark crop as sold
            const cropRes = await fetch('http://localhost:3000/mark-crop-sold', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cropId: currentOffer.crop_id }),
            });
            
            if (!cropRes.ok) {
              throw new Error('Failed to mark crop as sold');
            }
            
            // Create delivery tracking record
            const trackingDocRef = doc(db, 'delivery_tracking', currentOffer.id);
            await setDoc(trackingDocRef, {
              transaction_id: currentOffer.id,
              offer_id: currentOffer.id,
              farmer_id: currentChat?.farmer_id,
              retailer_id: user?.id,
              status: 'in_transit',
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            });
            
            // Set transaction ID for location tracking
            setTransactionId(currentOffer.id);
            setShowLocationTracker(true);
            
            toast.success('Payment successful! You can now track the delivery.');
            
            // Refresh data
            await useAppStore.getState().refreshAllData();
            
          } catch (error) {
            console.error('Error updating transaction/crop status:', error);
            alert('Payment succeeded but failed to update transaction/crop status. Please contact support.');
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: { color: '#3399cc' },
      };
      // Add TypeScript declaration for Razorpay
      declare global {
        interface Window {
          Razorpay: any;
        }
      }
      
      // Make sure Razorpay is loaded before initializing
      const loadRazorpayScript = () => {
        return new Promise<void>((resolve) => {
          if (typeof window.Razorpay !== 'undefined') {
            resolve();
            return;
          }
          
          console.log('Loading Razorpay script...');
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => {
            console.log('Razorpay script loaded successfully');
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load Razorpay script');
            toast.error('Failed to load payment gateway. Please try again.');
            resolve(); // Resolve anyway to prevent hanging
          };
          document.body.appendChild(script);
        });
      };
      
      // Load script and initialize Razorpay
      loadRazorpayScript().then(() => {
        try {
          console.log('Initializing Razorpay with options:', options);
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (error) {
          console.error('Error initializing Razorpay:', error);
          toast.error('Failed to initialize payment gateway. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error in payment flow:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  // Check if there's a completed transaction for this chat
  useEffect(() => {
    if (currentChat && user) {
      try {
        // Query for transactions related to this chat's offer
        const q = query(
          collection(db, 'transactions'),
          where('offer_id', 'in', userOffers.map(o => o.id)),
          where('status', '==', 'completed')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const transaction = querySnapshot.docs[0];
            setTransactionId(transaction.id);
            setShowLocationTracker(true);
          }
        });
        
        // Clean up subscription on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error checking for transactions:', error);
      }
    }
  }, [currentChat, user, userOffers]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-lg shadow-md pb-6">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <MessageCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
            <p className="text-sm text-gray-600">Re: {cropName}</p>
          </div>
        </div>
        <div className="flex items-center">
          {showLocationTracker && <MapPin size={18} className="text-green-600 mr-2" />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage(msg.sender_id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm flex items-center">
                  {msg.content}
                  {renderStatusIcon(msg)}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage(msg.sender_id) ? 'text-green-100 text-right' : 'text-gray-500 text-left'
                  }`}
                >
                  {formatTime(msg.created_at)}
                </div>
                {msg.message_type === 'price_negotiation' && msg.price && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-500">
                    <div className="text-xs font-semibold text-yellow-800">
                      Price Negotiation: ${msg.price}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
      {/* Location Tracker */}
      {showLocationTracker && transactionId && (
        <div className="px-4 mb-4">
          <LocationTracker 
            transactionId={transactionId}
            offerId={transactionId} /* Using transactionId as offerId since they're the same in our implementation */
            farmerId={currentChat?.farmer_id || ''}
            retailerId={currentChat?.retailer_id || ''}
            onDeliveryComplete={() => {
              toast.success('Delivery process completed!');
            }}
          />
        </div>
      )}
      
      {/* Price Negotiation Input for Retailer */}
      {user?.role === 'retailer' && !showLocationTracker && (
        <>
          {/* Pay Now button logic */}
          {(() => {
            const cropId = currentChat?.crop_id;
            const retailerId = user.id;
            const offers = useAppStore.getState().userOffers;
            const offer = offers.find(o => o.crop_id === cropId && o.retailer_id === retailerId && o.status === 'accepted');
            if (offer) {
              return (
                <button
                  className="w-full mb-2 py-2 px-4 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition-colors"
                  onClick={() => handlePayNow(offer)}
                >
                  Pay Now
                </button>
              );
            }
            return null;
          })()}
          <form onSubmit={handleSendPrice} className="p-4 border-t border-gray-200 bg-white flex space-x-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Propose new price..."
              className="flex-1 px-3 py-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={isPriceLoading}
            />
            <button
              type="submit"
              disabled={!price.trim() || isPriceLoading}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPriceLoading ? 'Sending...' : 'Propose Price'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;