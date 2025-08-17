import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import ChatList from '../../components/ChatList';
import Chat from '../../components/Chat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const RetailerChats = () => {
  const [searchParams] = useSearchParams();
  const { user, setCurrentChat, createOrGetChat } = useAppStore();
  const [selectedChat, setSelectedChat] = useState<{ id: string; crop_id: string; farmer_id: string; retailer_id: string } | null>(null);
  const [chatDetails, setChatDetails] = useState<{ cropName: string; otherUserName: string } | null>(null);

  useEffect(() => {
    if (selectedChat) {
      fetchChatDetails(selectedChat);
    }
  }, [selectedChat]);

  // Handle URL parameters for direct chat access (NEW)
  useEffect(() => {
    const farmerId = searchParams.get('farmer');
    const cropId = searchParams.get('crop');
    if (!farmerId || !cropId || !user) {
      console.warn('Missing farmerId, cropId, or user for chat initialization', { farmerId, cropId, user });
      return;
    }
    const initializeChat = async () => {
      const { error, chat } = await createOrGetChat(cropId, user.id, farmerId);
      if (!error && chat) {
        console.log('Selected/created chat:', chat, 'id:', chat.id);
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
      
      // Get farmer name
      const farmerDoc = await getDoc(doc(db, 'users', chat.farmer_id));
      const farmerName = farmerDoc.exists() ? farmerDoc.data().name : 'Unknown Farmer';
      
      setChatDetails({ cropName, otherUserName: farmerName });
    } catch (error) {
      console.error('Error fetching chat details:', error);
      setChatDetails({ cropName: 'Unknown Crop', otherUserName: 'Unknown Farmer' });
    }
  };

  const handleSelectChat = (chat: { id: string; crop_id: string; farmer_id: string; retailer_id: string }) => {
    setSelectedChat(chat);
    setCurrentChat(chat);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">Please log in to access your chats.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/retailer/dashboard"
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Chat with farmers about their crops</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <ChatList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChat?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 h-[calc(100vh-150px)] flex flex-col min-h-0">
          {selectedChat && chatDetails ? (
            <Chat
              chatId={selectedChat.id}
              otherUserName={chatDetails.otherUserName}
              cropName={chatDetails.cropName}
            />
          ) : (
            <div className="h-full bg-white rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a chat from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetailerChats; 