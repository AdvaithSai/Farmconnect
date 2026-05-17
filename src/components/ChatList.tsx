import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  offer_id: string | null;
  price: number | null;
  created_at: string;
}

interface ChatListProps {
  onSelectChat: (chat: { id: string; crop_id: string; farmer_id: string; retailer_id: string }) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const { user, chats, fetchUserChats } = useAppStore();
  const [chatDetails, setChatDetails] = useState<{ [key: string]: { cropName: string; otherUserName: string } }>({});
  const [lastReadMap, setLastReadMap] = useState<{ [chatId: string]: string }>({});
  const [chatMessagesMap, setChatMessagesMap] = useState<{ [chatId: string]: Message[] }>({});

  // Real-time listener for all last reads for the user
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chat_reads'), where('user_id', '==', user.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const map: { [chatId: string]: string } = {};
      snap.forEach(doc => {
        const data = doc.data();
        map[data.chat_id] = data.last_read_at;
      });
      setLastReadMap(map);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for latest messages for each chat
  useEffect(() => {
    if (chats.length === 0) return;
    const unsubscribes: (() => void)[] = [];
    const map: { [chatId: string]: Message[] } = {};
    chats.forEach((chat) => {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chat_id', '==', chat.id),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      const unsubscribe = onSnapshot(messagesQuery, (snap) => {
        map[chat.id] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        // We need to update state for each chat individually
        setChatMessagesMap((prev) => ({ ...prev, [chat.id]: map[chat.id] }));
      });
      unsubscribes.push(unsubscribe);
    });
    return () => { unsubscribes.forEach(unsub => unsub()); };
  }, [chats]);

  useEffect(() => {
    if (user) fetchUserChats();
  }, [user, fetchUserChats]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      const details: { [key: string]: { cropName: string; otherUserName: string } } = {};
      for (const chat of chats) {
        try {
          const cropDoc = await getDoc(doc(db, 'crops', chat.crop_id));
          const cropName = cropDoc.exists() ? cropDoc.data().name : 'Unknown Crop';
          const otherUserId = user?.role === 'farmer' ? chat.retailer_id : chat.farmer_id;
          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          const otherUserName = otherUserDoc.exists() ? otherUserDoc.data().name : 'Unknown User';
          details[chat.id] = { cropName, otherUserName };
        } catch (error) {
          console.error('Error fetching chat details:', error);
          details[chat.id] = { cropName: 'Unknown Crop', otherUserName: 'Unknown User' };
        }
      }
      setChatDetails(details);
    };
    if (chats.length > 0) {
      fetchChatDetails();
    }
  }, [chats, user]);

  // Count unread messages for each chat
  const getUnreadCount = (chatId: string) => {
    const lastRead = lastReadMap[chatId];
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !user) return 0;
    const otherUserId = user.role === 'farmer' ? chat.retailer_id : chat.farmer_id;
    const messages = chatMessagesMap[chatId] || [];
    return messages.filter(
      (msg) => msg.sender_id === otherUserId && (!lastRead || new Date(msg.created_at) > new Date(lastRead))
    ).length;
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return 'No messages';
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please log in to view your chats.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 h-full flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-white/40 bg-white/30 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-gray-900 drop-shadow-sm">Conversations</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {chats.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-70">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[200px]">Start chatting when you make or receive offers.</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {chats.map((chat) => {
              const details = chatDetails[chat.id];
              const isSelected = selectedChatId === chat.id;
              const unreadCount = getUnreadCount(chat.id);
              
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`group relative p-4 cursor-pointer transition-all duration-200 rounded-xl border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 shadow-md shadow-green-500/20 transform scale-[1.02]' 
                      : 'bg-white/40 hover:bg-white border-white/50 hover:shadow-sm hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner transition-colors ${isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300'}`}>
                            <MessageCircle size={22} className={isSelected ? 'text-white' : 'text-green-700'} />
                          </div>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white text-[10px] font-bold text-white shadow-sm animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-semibold truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {details?.otherUserName || 'Loading...'}
                          </p>
                          <p className={`text-sm font-medium truncate mt-0.5 transition-colors ${isSelected ? 'text-green-100' : 'text-gray-500'}`}>
                            Re: {details?.cropName || 'Loading...'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex flex-col items-end">
                      <div className={`flex items-center space-x-1 text-[11px] font-semibold tracking-wide uppercase transition-colors ${isSelected ? 'text-green-200' : 'text-gray-400'}`}>
                        <Clock size={12} className={isSelected ? 'opacity-80' : 'opacity-60'} />
                        <span>{formatLastMessageTime(chat.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 