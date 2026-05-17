import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import ChatList from '../../components/ChatList';
import Chat from '../../components/Chat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThemeLoader from '../../components/ThemeLoader';

const FarmerChats = () => {
  const [searchParams] = useSearchParams();
  const { user, setCurrentChat, createOrGetChat } = useAppStore();
  const [selectedChat, setSelectedChat] = useState<{ id: string; crop_id: string; farmer_id: string; retailer_id: string } | null>(null);
  const [chatDetails, setChatDetails] = useState<{ cropName: string; otherUserName: string } | null>(null);

  useEffect(() => {
    if (selectedChat) {
      fetchChatDetails(selectedChat);
    }
  }, [selectedChat]);

  // Handle URL parameters for direct chat access
  useEffect(() => {
    const retailerId = searchParams.get('retailer');
    const cropId = searchParams.get('crop');
    if (!retailerId || !cropId || !user) return;
    // Auto-create or get existing chat
    const initializeChat = async () => {
      const { error, chat } = await createOrGetChat(cropId, retailerId, user.id);
      if (!error && chat) {
        setSelectedChat(chat);
        setCurrentChat(chat);
      }
    };
    initializeChat();
  }, [searchParams, user, createOrGetChat, setCurrentChat]);

  const fetchChatDetails = async (chat: { id: string; crop_id: string; farmer_id: string; retailer_id: string }) => {
    try {
      // Get crop name
      const cropDoc = await getDoc(doc(db, 'crops', chat.crop_id));
      const cropName = cropDoc.exists() ? cropDoc.data().name : 'Unknown Crop';
      
      // Get retailer name
      const retailerDoc = await getDoc(doc(db, 'users', chat.retailer_id));
      const retailerName = retailerDoc.exists() ? retailerDoc.data().name : 'Unknown Retailer';
      
      setChatDetails({ cropName, otherUserName: retailerName });
    } catch (error) {
      console.error('Error fetching chat details:', error);
      setChatDetails({ cropName: 'Unknown Crop', otherUserName: 'Unknown Retailer' });
    }
  };

  const handleSelectChat = (chat: { id: string; crop_id: string; farmer_id: string; retailer_id: string }) => {
    setSelectedChat(chat);
    setCurrentChat(chat);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96 relative">
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <ThemeLoader />
        </div>
        <div className="blur-sm pointer-events-none select-none opacity-60 transition-all duration-300 w-full h-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] bg-gradient-to-br from-green-50 to-green-100/50">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-200/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/farmer/dashboard"
              className="p-2 text-gray-600 hover:text-green-700 bg-white/50 backdrop-blur-sm rounded-full shadow-sm transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Messages</h1>
              <p className="text-gray-600">Chat with retailers about your crops</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-4 h-full">
            <ChatList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.id}
            />
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8 h-full flex flex-col min-h-0 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
            {selectedChat && chatDetails ? (
              <Chat
                chatId={selectedChat.id}
                otherUserName={chatDetails.otherUserName}
                cropName={chatDetails.cropName}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center animate-[fadeIn_0.5s_ease-out]">
                <div className="max-w-sm">
                  <div className="w-24 h-24 bg-green-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
                    <MessageCircle size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Your Messages
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    Select a conversation from the sidebar to view messages, negotiate prices, and finalize offers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerChats; 