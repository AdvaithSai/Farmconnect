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
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Conversations</h2>
      </div>
      <div className="divide-y divide-gray-200 overflow-y-auto max-h-[700px]">
        {chats.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No conversations yet.</p>
            <p className="text-sm text-gray-400">Start chatting when you make or receive offers.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const details = chatDetails[chat.id];
            const isSelected = selectedChatId === chat.id;
            const unreadCount = getUnreadCount(chat.id);
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MessageCircle size={20} className="text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {details?.otherUserName || 'Loading...'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Re: {details?.cropName || 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatLastMessageTime(chat.last_message_at)}</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList; 