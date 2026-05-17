import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Check, CheckCheck, MapPin } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';
import { doc, setDoc, collection, query, where, orderBy, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LocationTracker from './LocationTracker';

// Declare Razorpay types for TypeScript (single, global declaration)
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
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
      const offer = offers.find(o => o.crop_id === cropId && o.retailer_id === retailerId && (o.status === 'pending' || o.status === 'rejected' || o.status === 'accepted'));
      
      if (!offer) {
        // If there is no active/rejected offer, we create a new one!
        const { error } = await useAppStore.getState().makeOffer({
          crop_id: cropId,
          price: priceValue,
          message: 'Proposed a new price.',
        });
        if (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to create offer');
        } else {
          toast.success('Offer made and farmer notified!');
          setPrice('');
        }
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
      
      if (!keyData.success || !keyData.key) {
        console.error('Invalid Razorpay key response:', keyData);
        toast.error(`Payment configuration error: ${keyData.error || 'Invalid key response'}`);
        return;
      }
      
      const keyId = keyData.key;

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
      
      // Check if the response contains the expected data structure
      if (!data.success || !data.order) {
        console.error('Order creation failed or invalid response:', data);
        toast.error(`Failed to create order: ${data.error || 'Invalid response from server'}`);
        return;
      }
      
      // Initialize Razorpay with the order data
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

      // Make sure Razorpay is loaded before initializing
      const loadRazorpayScript = () => {
        return new Promise<void>((resolve) => {
          if (typeof window.Razorpay !== 'undefined') {
            resolve();
            return;
          }
          
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => {
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
        // Find the specific offer for this chat
        const currentOffer = userOffers.find(
          o => o.crop_id === currentChat?.crop_id && 
               o.retailer_id === currentChat?.retailer_id
        );
        
        if (!currentOffer) return;
        
        // Query for transactions related ONLY to this chat's offer
        const q = query(
          collection(db, 'transactions'),
          where('offer_id', '==', currentOffer.id),
          where('status', '==', 'completed')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            setTransactionId(currentOffer.id);
            setShowLocationTracker(true);
          } else {
            setShowLocationTracker(false);
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
    <div className="flex flex-col h-full min-h-0 bg-transparent rounded-2xl pb-2 relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/40 bg-white/50 backdrop-blur-md z-10 sticky top-0 rounded-t-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-inner">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 drop-shadow-sm leading-tight">{otherUserName}</h3>
            <p className="text-sm font-medium text-green-700 leading-tight">Re: {cropName}</p>
          </div>
        </div>
        <div className="flex items-center">
          {showLocationTracker && (
            <div className="flex items-center text-xs font-semibold text-green-700 bg-green-100/80 px-3 py-1.5 rounded-full shadow-sm animate-pulse border border-green-200">
              <MapPin size={14} className="mr-1" /> Tracking Live
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600">No messages yet</p>
            <p className="text-sm">Say hello and start negotiating!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender_id);
            const isPriceNeg = msg.message_type === 'price_negotiation' && msg.price;
            
            return (
              <div
                key={msg.id}
                className={`flex w-full animate-[fadeIn_0.3s_ease-out] ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[75%] lg:max-w-md px-4 py-3 shadow-md group ${
                    isOwn
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl rounded-br-sm ml-4'
                      : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 mr-4'
                  }`}
                >
                  {isPriceNeg ? (
                    <div className="flex flex-col">
                      <div className="text-[15px] leading-relaxed font-medium mb-3">
                        {msg.content}
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-xl border ${
                        isOwn ? 'bg-white/20 border-white/30 text-white' : 'bg-yellow-50 border-yellow-200 text-yellow-900'
                      }`}>
                        <div className="flex items-center font-bold text-lg">
                          <span className="text-sm mr-1 uppercase opacity-80">Offer:</span>
                          ₹{msg.price}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[15px] leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                  
                  <div
                    className={`flex items-center justify-end space-x-1 text-[11px] font-medium mt-1.5 opacity-80 ${
                      isOwn ? 'text-green-100' : 'text-gray-500'
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isOwn && (
                      <span className="ml-1">
                        {renderStatusIcon(msg)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Interactive Footer Elements */}
      <div className="mt-auto flex flex-col px-4 pb-2 space-y-3 z-10 relative">
        
        {/* Location Tracker */}
        {showLocationTracker && transactionId && (
          <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white p-1">
            <LocationTracker 
              key={transactionId}
              transactionId={transactionId}
              offerId={transactionId}
              farmerId={currentChat?.farmer_id || ''}
              retailerId={currentChat?.retailer_id || ''}
              onDeliveryComplete={() => {
                toast.success('Delivery process completed!');
              }}
            />
          </div>
        )}
        
        {/* Price Negotiation & Payment Input for Retailer */}
        {user?.role === 'retailer' && !showLocationTracker && (
          <div className="w-full flex flex-col space-y-2">
            {(() => {
              const cropId = currentChat?.crop_id;
              const retailerId = user.id;
              const offers = useAppStore.getState().userOffers;
              const offer = offers.find(o => o.crop_id === cropId && o.retailer_id === retailerId && o.status === 'accepted');
              if (offer) {
                return (
                  <button
                    className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 border border-yellow-300"
                    onClick={() => handlePayNow(offer)}
                  >
                    <CheckCheck size={20} />
                    <span>Pay ₹{offer.price} Now</span>
                  </button>
                );
              }
              return null;
            })()}
            <form onSubmit={handleSendPrice} className="w-full flex space-x-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Propose new price..."
                className="flex-1 px-4 py-3 bg-white/70 backdrop-blur-sm border border-yellow-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white shadow-sm transition-all"
                disabled={isPriceLoading}
              />
              <button
                type="submit"
                disabled={!price.trim() || isPriceLoading}
                className="px-5 py-3 bg-yellow-500 text-yellow-950 font-bold rounded-2xl hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {isPriceLoading ? '...' : 'Propose'}
              </button>
            </form>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="w-full">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white shadow-sm transition-all text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:shadow-none disabled:transform-none shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center"
            >
              <Send size={20} className={message.trim() && !isLoading ? "ml-1" : ""} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;