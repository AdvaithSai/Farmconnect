import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { create } from 'zustand';
import { auth, db, googleProvider, facebookProvider } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import type { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type Crop = Database['public']['Tables']['crops']['Row'];
type Offer = Database['public']['Tables']['offers']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Chat = Database['public']['Tables']['chats']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export interface Review {
  id?: string;
  transactionId: string;
  reviewerId: string;
  targetUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface AppState {
  user: User | null;
  loading: boolean;
  crops: Crop[];
  userOffers: Offer[];
  chats: Chat[];
  currentChat: { id: string; crop_id: string; farmer_id: string; retailer_id: string } | null;
  messages: Message[];
  farmerTransactions: Transaction[];
  
  // Real-time listener unsubs
  unsubCrops: (() => void) | null;
  unsubOffers: (() => void) | null;
  unsubChats: (() => void) | null;
  unsubTransactions: (() => void) | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ error: unknown | null }>;
  register: (email: string, password: string, name: string, role: 'farmer' | 'retailer') => Promise<{ error: unknown | null, user: User | null }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ error: unknown | null }>;
  loginWithFacebook: () => Promise<{ error: unknown | null }>;
  
  // Fetch data
  fetchCrops: () => Promise<void>;
  fetchUserOffers: () => Promise<void>;
  fetchUserChats: () => Promise<void>;
  fetchChatMessages: (chatId: string) => Promise<void>;
  fetchFarmerTransactions: () => Promise<void>;
  
  // Farmer actions
  addCrop: (cropData: Partial<Crop>) => Promise<{ error: unknown | null, crop: Crop | null }>;
  updateCropStatus: (cropId?: string, status?: 'available' | 'pending' | 'sold') => Promise<{ error: unknown | null }>;
  
  // Retailer actions
  makeOffer: (offerData: { crop_id: string; price: number; message: string }) => Promise<{ error: unknown | null, offer: Offer | null }>;
  updateOfferPrice: (offerId: string, newPrice: number) => Promise<{ error: unknown | null, offer: Offer | null }>;
  
  // Chat actions
  createOrGetChat: (cropId: string, retailerId: string, farmerId: string) => Promise<{ error: unknown | null, chat: Chat | null }>;
  sendMessage: (chatId: string, content: string, messageType?: 'text' | 'offer' | 'price_negotiation', offerId?: string, price?: number) => Promise<{ error: unknown | null, message: Message | null }>;
  setCurrentChat: (chat: { id: string; crop_id: string; farmer_id: string; retailer_id: string } | null) => void;
  
  // Common actions
  respondToOffer: (offerId: string, newStatus: 'accepted' | 'rejected') => Promise<{ error: unknown | null }>;
  processPayment: () => Promise<{ error: unknown | null, transaction: Transaction | null }>;
  refreshAllData: () => Promise<void>;
  
  // Review actions
  submitReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<{ error: unknown | null }>;
  getUserRating: (userId: string) => Promise<{ average: number; count: number; reviews: Review[] }>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  loading: false,
  crops: [],
  userOffers: [],
  chats: [],
  currentChat: null,
  messages: [],
  farmerTransactions: [],

  // Real-time listener unsubs
  unsubCrops: null,
  unsubOffers: null,
  unsubChats: null,
  unsubTransactions: null,

  // Auth actions
  login: async (email, password) => {
    set({ loading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data() as User | undefined;
      set({ user: userData || null, loading: false });
      return { error: null };
    } catch (error: unknown) {
      set({ loading: false });
      return { error };
    }
  },
  
  register: async (email, password, name, role) => {
    set({ loading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const createdAt = new Date().toISOString();
      // Create user profile in Firestore
      const userProfile: User = { id: user.uid, created_at: createdAt, email, name, role, phone: null, address: null };
      await setDoc(doc(db, 'users', user.uid), userProfile);
      set({ user: userProfile, loading: false });
      return { error: null, user: userProfile };
    } catch (error: unknown) {
      set({ loading: false });
      return { error, user: null };
    }
  },
  
  logout: async () => {
    const { unsubCrops, unsubOffers, unsubChats, unsubTransactions } = get();
    if (unsubCrops) unsubCrops();
    if (unsubOffers) unsubOffers();
    if (unsubChats) unsubChats();
    if (unsubTransactions) unsubTransactions();
    
    await signOut(auth);
    set({ 
      user: null, crops: [], userOffers: [], chats: [], currentChat: null, messages: [], farmerTransactions: [],
      unsubCrops: null, unsubOffers: null, unsubChats: null, unsubTransactions: null 
    });
  },
  
  loginWithGoogle: async () => {
    set({ loading: true });
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userProfile = userDoc.data() as User | undefined;
      if (!userProfile) {
        // New user, create profile
        userProfile = {
          id: user.uid,
          created_at: new Date().toISOString(),
          email: user.email || '',
          name: user.displayName || '',
          role: 'retailer', // Default to retailer, can be changed later
          phone: user.phoneNumber || null,
          address: null
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
      }
      set({ user: userProfile, loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error };
    }
  },
  
  loginWithFacebook: async () => {
    set({ loading: true });
    try {
      const result: UserCredential = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userProfile = userDoc.data() as User | undefined;
      if (!userProfile) {
        // New user, create profile
        userProfile = {
          id: user.uid,
          created_at: new Date().toISOString(),
          email: user.email || '',
          name: user.displayName || '',
          role: 'retailer', // Default to retailer, can be changed later
          phone: user.phoneNumber || null,
          address: null
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
      }
      set({ user: userProfile, loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error };
    }
  },
  
  // Fetch data with real-time listeners
  fetchCrops: async () => {
    set({ loading: true });
    try {
      // Unsubscribe from previous listener if it exists
      const currentUnsub = get().unsubCrops;
      if (currentUnsub) currentUnsub();

      const user = get().user;
      let cropsQuery;
      if (user && user.role === 'farmer') {
        cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
      } else {
        cropsQuery = query(collection(db, 'crops'), where('status', '==', 'available'));
      }
      
      const unsubCrops = onSnapshot(cropsQuery, (querySnapshot) => {
        const crops = querySnapshot.docs.map(doc => ({ ...(doc.data() as Crop), id: doc.id }));
        set({ crops, loading: false });
      }, (error) => {
        console.error('Error fetching crops:', error);
        toast.error('Failed to sync crops in real-time.');
        set({ loading: false });
      });

      set({ unsubCrops });
    } catch (error) {
      set({ loading: false });
      toast.error('Failed to initialize crops listener.');
      console.error('Error in fetchCrops:', error);
    }
  },
  
  fetchUserOffers: async () => {
    const user = get().user;
    if (!user) {
      set({ userOffers: [] });
      return;
    }

    const currentUnsub = get().unsubOffers;
    if (currentUnsub) currentUnsub();

    let offersQuery;
    if (user.role === 'farmer') {
      const cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
      const cropsSnapshot = await getDocs(cropsQuery);
      const cropIds = cropsSnapshot.docs.map(doc => doc.id);
      if (cropIds.length === 0) {
        set({ userOffers: [] });
        return;
      }
      offersQuery = query(collection(db, 'offers'), where('crop_id', 'in', cropIds));
    } else if (user.role === 'retailer') {
      offersQuery = query(collection(db, 'offers'), where('retailer_id', '==', user.id));
    } else {
      set({ userOffers: [] });
      return;
    }
    
    try {
      const unsubOffers = onSnapshot(offersQuery, (offersSnapshot) => {
        const offers = offersSnapshot.docs.map(doc => ({ ...(doc.data() as Offer), id: doc.id }));
        set({ userOffers: offers });
      }, (error) => {
        console.error('Error fetching offers:', error);
      });
      set({ unsubOffers });
    } catch (error) {
      toast.error('Failed to sync offers in real-time.');
      console.error('Error in fetchUserOffers:', error);
    }
  },
  
  fetchUserChats: async () => {
    const user = get().user;
    if (!user) {
      set({ chats: [] });
      return;
    }

    const currentUnsub = get().unsubChats;
    if (currentUnsub) currentUnsub();

    const chatsCol = collection(db, 'chats');
    let chatsQuery;
    if (user.role === 'farmer') {
      chatsQuery = query(chatsCol, where('farmer_id', '==', user.id));
    } else {
      chatsQuery = query(chatsCol, where('retailer_id', '==', user.id));
    }
    
    try {
      const unsubChats = onSnapshot(chatsQuery, (chatsSnapshot) => {
        const chats = chatsSnapshot.docs.map(doc => ({ ...(doc.data() as Chat), id: doc.id }));
        set({ chats, loading: false });
      }, (error) => {
        console.error('Error fetching chats:', error);
      });
      set({ unsubChats });
    } catch (error) {
      toast.error('Failed to sync chats in real-time.');
      console.error('Error in fetchUserChats:', error);
    }
  },
  
  fetchChatMessages: async (chatId) => {
    const user = get().user;
    if (!user) {
      set({ messages: [] });
      return;
    }
    // Fetch messages for this chat
    const messagesCol = collection(db, 'messages');
    const messagesQuery = query(messagesCol, where('chat_id', '==', chatId));
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(doc => ({ ...(doc.data() as Message), id: doc.id }));
    set({ messages, loading: false });
  },

  fetchFarmerTransactions: async () => {
    const user = get().user;
    if (!user || user.role !== 'farmer') {
      set({ farmerTransactions: [] });
      return;
    }

    const currentUnsub = get().unsubTransactions;
    if (currentUnsub) currentUnsub();

    const cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
    const cropsSnapshot = await getDocs(cropsQuery);
    const cropIds = cropsSnapshot.docs.map(doc => doc.id);
    if (cropIds.length === 0) {
      set({ farmerTransactions: [] });
      return;
    }
    
    const txQuery = query(collection(db, 'transactions'), where('crop_id', 'in', cropIds));
    
    try {
      const unsubTransactions = onSnapshot(txQuery, (txSnapshot) => {
        const transactions = txSnapshot.docs.map(doc => ({ ...(doc.data() as Transaction), id: doc.id }));
        set({ farmerTransactions: transactions });
      });
      set({ unsubTransactions });
    } catch (error) {
      console.error('Error in fetchFarmerTransactions:', error);
    }
  },
  
  // Farmer actions
  addCrop: async (cropData) => {
    const user = get().user;
    if (!user || user.role !== 'farmer') {
      return { error: new Error('Unauthorized'), crop: null };
    }
    try {
      const newCrop = {
        created_at: new Date().toISOString(),
        farmer_id: user.id,
        name: cropData.name || '',
        description: cropData.description || '',
        quantity: cropData.quantity || 0,
        unit: cropData.unit || '',
        price_expectation: cropData.price_expectation ?? null,
        location: cropData.location || '',
        harvest_date: cropData.harvest_date || '',
        status: 'available' as const,
        image_url: cropData.image_url ?? null,
      };
      const docRef = await addDoc(collection(db, 'crops'), newCrop);
      return { error: null, crop: { id: docRef.id, ...newCrop } };
    } catch (error) {
      return { error, crop: null };
    }
  },
  
  updateCropStatus: async (cropId?: string, status?: 'available' | 'pending' | 'sold') => {
    if (!cropId || !status) {
      return { error: new Error('cropId and status are required') };
    }
    try {
      const cropRef = doc(db, 'crops', cropId);
      await setDoc(cropRef, { status }, { merge: true });
      // Refresh crops in state
      await get().fetchCrops();
      return { error: null };
    } catch (error) {
      console.error('Failed to update crop status:', error);
      return { error };
    }
  },
  
  // Retailer actions
  makeOffer: async (offerData) => {
    const user = get().user;
    if (!user || user.role !== 'retailer') {
      return { error: new Error('Unauthorized'), offer: null };
    }
    try {
      const { crop_id, price, message } = offerData;
      // Check for existing offer from this retailer for this crop
      const offersCol = collection(db, 'offers');
      const existingOfferQuery = query(offersCol, where('crop_id', '==', crop_id), where('retailer_id', '==', user.id));
      const existingOfferSnap = await getDocs(existingOfferQuery);
      if (!existingOfferSnap.empty) {
        return { error: new Error('You have already made an offer for this crop.'), offer: null };
      }
      const newOffer = {
        crop_id,
        retailer_id: user.id,
        price,
        message: message || null,
        status: 'pending' as 'pending' | 'accepted' | 'rejected' | 'completed',
        created_at: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'offers'), newOffer);
      // --- Chat notification logic ---
      // Get crop details for message
      const cropDoc = await getDoc(doc(db, 'crops', crop_id));
      let cropName = 'crop';
      let quantity = '';
      let unit = '';
      let farmerId = '';
      if (cropDoc.exists()) {
        const cropData = cropDoc.data() as Crop;
        cropName = cropData.name;
        quantity = cropData.quantity?.toString() || '';
        unit = cropData.unit || '';
        farmerId = cropData.farmer_id;
      }
      // Create or get chat
      let chatId = '';
      const { error: chatError, chat } = await get().createOrGetChat(crop_id, user.id, farmerId);
      if (!chatError && chat) {
        chatId = chat.id;
        // Send offer message
        const offerMsg = `Offer for ${cropName} of ${quantity} ${unit} is ₹${price}`;
        await get().sendMessage(chatId, offerMsg, 'offer', docRef.id, price);
        // Refresh chat list for both users
        await get().fetchUserChats();
      }
      return { error: null, offer: { id: docRef.id, ...newOffer } };
    } catch (error) {
      return { error, offer: null };
    }
  },

  updateOfferPrice: async (offerId: string, newPrice: number) => {
    const user = get().user;
    if (!user || user.role !== 'retailer') {
      return { error: new Error('Unauthorized'), offer: null };
    }
    try {
      const offerRef = doc(db, 'offers', offerId);
      const offerSnap = await getDoc(offerRef);
      if (!offerSnap.exists()) {
        return { error: new Error('Offer not found'), offer: null };
      }
      const offerData = offerSnap.data() as Offer;
      if (offerData.retailer_id !== user.id) {
        return { error: new Error('Unauthorized to update this offer'), offer: null };
      }
      if (offerData.status === 'completed') {
        return { error: new Error('Cannot update offer that is already completed'), offer: null };
      }
      
      // Update the offer price and set status back to pending
      await setDoc(offerRef, { price: newPrice, status: 'pending' }, { merge: true });
      
      // Send price negotiation message to farmer
      try {
        // Get crop details for the message
        const cropSnap = await getDoc(doc(db, 'crops', offerData.crop_id));
        let cropName = 'crop';
        let quantity = '';
        let unit = '';
        if (cropSnap.exists()) {
          const cropData = cropSnap.data() as Crop;
          cropName = cropData.name;
          quantity = cropData.quantity?.toString() || '';
          unit = cropData.unit || '';
        }
        
        // Get farmer_id from crop
        let farmerId = '';
        if (cropSnap.exists()) {
          const cropData = cropSnap.data() as Crop;
          farmerId = cropData.farmer_id;
        }
        
        // Create or get chat between retailer and farmer
        const { error: chatError, chat } = await get().createOrGetChat(offerData.crop_id, user.id, farmerId);
        if (!chatError && chat) {
          // Send price negotiation message
          const negotiationMessage = `I have updated my offer price to ₹${newPrice} for ${cropName} of ${quantity} ${unit}.`;
          await get().sendMessage(chat.id, negotiationMessage, 'price_negotiation', offerId, newPrice);
        }
      } catch (chatError) {
        console.error('Failed to send price negotiation message:', chatError);
        // Don't fail the entire operation if chat message fails
      }
      
      const updatedOffer = { ...offerData, id: offerId, price: newPrice, status: 'pending' as const };
      
      // Update local state so UI reflects immediately
      set((state) => ({
        userOffers: state.userOffers.map(o => (o.id === offerId ? updatedOffer : o))
      }));
      
      return { error: null, offer: updatedOffer };
    } catch (error) {
      return { error, offer: null };
    }
  },
  
  // Chat actions
  createOrGetChat: async (cropId, retailerId, farmerId) => {
    const user = get().user;
    if (!user) {
      return { error: new Error('Unauthorized'), chat: null };
    }
    try {
      // Check if a chat already exists between the farmer and the retailer for this crop
      const chatsCol = collection(db, 'chats');
      const chatsQuery = query(
        chatsCol,
        where('farmer_id', '==', farmerId),
        where('retailer_id', '==', retailerId),
        where('crop_id', '==', cropId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      if (chatsSnapshot.docs.length > 0) {
        const docSnap = chatsSnapshot.docs[0];
        const data = docSnap.data();
        const chat: Chat = {
          id: docSnap.id,
          created_at: data.created_at,
          crop_id: data.crop_id,
          farmer_id: data.farmer_id,
          retailer_id: data.retailer_id,
          last_message_at: data.last_message_at ?? null,
          status: data.status,
        };
        set({ currentChat: chat });
        return { error: null, chat };
      }
      // If no chat exists, create a new one
      const newChat: Omit<Chat, 'id'> = {
        created_at: new Date().toISOString(),
        farmer_id: farmerId,
        retailer_id: retailerId,
        crop_id: cropId,
        last_message_at: null,
        status: 'active',
      };
      const docRef = await addDoc(collection(db, 'chats'), newChat);
      const createdChat = { id: docRef.id, ...newChat };
      set({ currentChat: createdChat });
      return { error: null, chat: createdChat };
    } catch (error) {
      return { error, chat: null };
    }
  },
  
  sendMessage: async (chatId, content, messageType, offerId, price) => {
    const user = get().user;
    if (!user) {
      return { error: new Error('Unauthorized'), message: null };
    }
    try {
             const newMessage: Omit<Message, 'id'> = {
         chat_id: chatId,
         sender_id: user.id,
         content,
         message_type: messageType || 'text',
         offer_id: offerId || null,
         price: price || null,
         created_at: new Date().toISOString(),
       };
       const docRef = await addDoc(collection(db, 'messages'), newMessage);
       const createdMessage = { id: docRef.id, ...newMessage };
       set({ messages: [...get().messages, createdMessage] });
       return { error: null, message: createdMessage };
    } catch (error) {
      return { error, message: null };
    }
  },
  
  setCurrentChat: (chat) => {
    set({ currentChat: chat });
  },
  
  // Common actions
  respondToOffer: async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const offerRef = doc(db, 'offers', offerId);
      await setDoc(offerRef, { status: newStatus }, { merge: true });
      if (newStatus === 'accepted') {
        // Get the offer details
        const offerSnap = await getDoc(offerRef);
        if (offerSnap.exists()) {
          const offerData = offerSnap.data() as Offer;
          // Set crop status to 'pending' when offer is accepted
          const cropRef = doc(db, 'crops', offerData.crop_id);
          try {
            await setDoc(cropRef, { status: 'pending' }, { merge: true });
            // Refetch crops immediately to update UI
            await get().fetchCrops();
          } catch (err) {
            console.error('Failed to update crop status to pending:', err);
          }
          // Reject all other offers for this crop
          const offersCol = collection(db, 'offers');
          const offersQuery = query(offersCol, where('crop_id', '==', offerData.crop_id), where('status', '==', 'pending'));
          const offersSnap = await getDocs(offersQuery);
          const batch = (await import('firebase/firestore')).writeBatch(db);
          offersSnap.forEach(docSnap => {
            if (docSnap.id !== offerId) {
              batch.set(doc(db, 'offers', docSnap.id), { status: 'rejected' }, { merge: true });
            }
          });
          await batch.commit();
          
          // Send acceptance message to retailer
          try {
            // Get crop details for the message
            const cropSnap = await getDoc(doc(db, 'crops', offerData.crop_id));
            let cropName = 'crop';
            let quantity = '';
            let unit = '';
            let farmerId = '';
            if (cropSnap.exists()) {
              const cropData = cropSnap.data() as Crop;
              cropName = cropData.name;
              quantity = cropData.quantity?.toString() || '';
              unit = cropData.unit || '';
              farmerId = cropData.farmer_id;
            }
            
            // Create or get chat between farmer and retailer
            const { error: chatError, chat } = await get().createOrGetChat(offerData.crop_id, offerData.retailer_id, farmerId);
            if (!chatError && chat) {
              // Send acceptance message with crop details
              const acceptanceMessage = `Thank you for the offer price of ₹${offerData.price} for ${cropName} of ${quantity} ${unit}. It is accepted.`;
              await get().sendMessage(chat.id, acceptanceMessage, 'text');
            }
          } catch (chatError) {
            console.error('Failed to send acceptance message:', chatError);
            // Don't fail the entire operation if chat message fails
          }
          
          // Create a transaction record
          let farmer_id = '';
          try {
            const cropSnap = await getDoc(doc(db, 'crops', offerData.crop_id));
            if (cropSnap.exists()) {
              const cropData = cropSnap.data() as Crop;
              farmer_id = cropData.farmer_id;
            }
          } catch { /* ignore error, fallback to empty farmer_id */ }
          const transaction = {
            crop_id: offerData.crop_id,
            farmer_id,
            retailer_id: offerData.retailer_id,
            offer_id: offerId,
            amount: offerData.price,
            created_at: new Date().toISOString(),
            status: 'pending_payment',
          };
          await addDoc(collection(db, 'transactions'), transaction);
        }
      }
      // Optionally, refetch offers after update
      await get().fetchUserOffers();
      await get().fetchCrops();
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
  
  submitReview: async (review) => {
    try {
      await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: new Date().toISOString()
      });
      return { error: null };
    } catch (error) {
      console.error('Error submitting review:', error);
      return { error };
    }
  },
  
  getUserRating: async (userId) => {
    try {
      const q = query(collection(db, 'reviews'), where('targetUserId', '==', userId));
      const snap = await getDocs(q);
      const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      
      if (reviews.length === 0) {
        return { average: 0, count: 0, reviews: [] };
      }
      
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      const average = sum / reviews.length;
      
      return { average, count: reviews.length, reviews };
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return { average: 0, count: 0, reviews: [] };
    }
  },

  // Global refresh functions for payment completion
  refreshAllData: async () => {
    await get().fetchCrops();
    await get().fetchUserOffers();
    await get().fetchUserChats();
    await get().fetchFarmerTransactions();
  },
  
  processPayment: async () => {
    // Payment is handled directly in components via Razorpay.
    // This store action exists for legacy compatibility.
    return { error: new Error('Use the Razorpay handler in the UI component to process payments.'), transaction: null };
  }
}));

// Add this function to allow global crop refresh
export async function globalFetchCrops() {
  const store = useAppStore.getState();
  if (store && typeof store.fetchCrops === 'function') {
    await store.fetchCrops();
  }
}