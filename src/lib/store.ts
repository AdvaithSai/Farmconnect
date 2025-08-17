import { create } from 'zustand';
import { auth, db, googleProvider, facebookProvider } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import type { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type Crop = Database['public']['Tables']['crops']['Row'];
type Offer = Database['public']['Tables']['offers']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Chat = Database['public']['Tables']['chats']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface AppState {
  user: User | null;
  loading: boolean;
  crops: Crop[];
  userOffers: Offer[];
  chats: Chat[];
  currentChat: { id: string; crop_id: string; farmer_id: string; retailer_id: string } | null;
  messages: Message[];
  farmerTransactions: Transaction[];
  
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
  updateCropStatus: () => Promise<{ error: unknown | null }>;
  
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
    await signOut(auth);
    set({ user: null, crops: [], userOffers: [], chats: [], currentChat: null, messages: [] });
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
  
  // Fetch data
  fetchCrops: async () => {
    set({ loading: true });
    try {
      const user = get().user;
      let cropsQuery;
      if (user && user.role === 'farmer') {
        // Only fetch crops for this farmer
        cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
        const querySnapshot = await getDocs(cropsQuery);
        const crops = querySnapshot.docs.map(doc => ({ ...(doc.data() as Crop), id: doc.id }));
        set({ crops, loading: false });
      } else {
        // Fetch all crops (for retailer or not logged in)
        const cropsCol = collection(db, 'crops');
        const cropsQuery = query(cropsCol, where('status', '==', 'available'));
        const querySnapshot = await getDocs(cropsQuery);
        const crops = querySnapshot.docs.map(doc => ({ ...(doc.data() as Crop), id: doc.id }));
        set({ crops, loading: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  fetchUserOffers: async () => {
    const user = get().user;
    if (!user) {
      set({ userOffers: [] });
      return;
    }
    let offersQuery;
    if (user.role === 'farmer') {
      // Fetch all crops for this farmer
      const cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
      const cropsSnapshot = await getDocs(cropsQuery);
      const cropIds = cropsSnapshot.docs.map(doc => doc.id);
      if (cropIds.length === 0) {
        set({ userOffers: [] });
        return;
      }
      offersQuery = query(collection(db, 'offers'), where('crop_id', 'in', cropIds));
    } else if (user.role === 'retailer') {
      // Fetch all offers made by this retailer
      offersQuery = query(collection(db, 'offers'), where('retailer_id', '==', user.id));
    } else {
      set({ userOffers: [] });
      return;
    }
    const offersSnapshot = await getDocs(offersQuery);
    const offers = offersSnapshot.docs.map(doc => ({ ...(doc.data() as Offer), id: doc.id }));
    set({ userOffers: offers });
  },
  
  fetchUserChats: async () => {
    const user = get().user;
    if (!user) {
      set({ chats: [] });
      return;
    }
    // Fetch all chats for this user (farmer or retailer)
    const chatsCol = collection(db, 'chats');
    let chatsQuery;
    if (user.role === 'farmer') {
      chatsQuery = query(chatsCol, where('farmer_id', '==', user.id));
    } else {
      chatsQuery = query(chatsCol, where('retailer_id', '==', user.id));
    }
    const chatsSnapshot = await getDocs(chatsQuery);
    const chats = chatsSnapshot.docs.map(doc => ({ ...(doc.data() as Chat), id: doc.id }));
    set({ chats, loading: false });
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
    // Get all crops for this farmer
    const cropsQuery = query(collection(db, 'crops'), where('farmer_id', '==', user.id));
    const cropsSnapshot = await getDocs(cropsQuery);
    const cropIds = cropsSnapshot.docs.map(doc => doc.id);
    if (cropIds.length === 0) {
      set({ farmerTransactions: [] });
      return;
    }
    // Get all transactions for these crops
    const txQuery = query(collection(db, 'transactions'), where('crop_id', 'in', cropIds));
    const txSnapshot = await getDocs(txQuery);
    const transactions = txSnapshot.docs.map(doc => ({ ...(doc.data() as Transaction), id: doc.id }));
    set({ farmerTransactions: transactions });
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
  
  updateCropStatus: async () => {
    // TODO: Implement Firestore logic for updating crop status
    throw new Error('updateCropStatus not implemented for Firebase yet.');
  },
  
  // Retailer actions
  makeOffer: async (offerData) => {
    const user = get().user;
    console.log('makeOffer called with:', offerData, 'user:', user);
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
        console.log('Offer already exists for crop:', crop_id, 'retailer:', user.id);
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
      console.log('Creating new offer:', newOffer);
      const docRef = await addDoc(collection(db, 'offers'), newOffer);
      console.log('Offer created with ID:', docRef.id);
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
        console.log('Offer message sent to chat:', chatId, offerMsg);
        // Refresh chat list for both users
        await get().fetchUserChats();
      }
      return { error: null, offer: { id: docRef.id, ...newOffer } };
    } catch (error) {
      console.error('Error in makeOffer:', error);
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
      if (offerData.status !== 'pending') {
        return { error: new Error('Cannot update offer that is not pending'), offer: null };
      }
      
      // Update the offer price
      await setDoc(offerRef, { price: newPrice }, { merge: true });
      
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
      
      return { error: null, offer: { ...offerData, id: offerId, price: newPrice } };
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
  
  // Global refresh functions for payment completion
  refreshAllData: async () => {
    await get().fetchCrops();
    await get().fetchUserOffers();
    await get().fetchUserChats();
    await get().fetchFarmerTransactions();
  },
  
  processPayment: async () => {
    // TODO: Implement Firestore logic for processing payment
    throw new Error('processPayment not implemented for Firebase yet.');
  }
}));

// Add this function to allow global crop refresh
export async function globalFetchCrops() {
  const store = useAppStore.getState();
  if (store && typeof store.fetchCrops === 'function') {
    await store.fetchCrops();
  }
}