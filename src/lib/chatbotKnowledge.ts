export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'farmer' | 'retailer' | 'payment' | 'delivery' | 'security' | 'general';
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'f_add_crop',
    title: 'How to list/add a crop (Farmer)',
    category: 'farmer',
    keywords: ['add crop', 'list crop', 'sell harvest', 'sell crop', 'upload crop', 'post crop', 'quantity', 'quintals', 'price'],
    content: 'Farmers can list crops by clicking "Add Crop" in the top bar. You must specify the crop category (e.g., Grains, Vegetables, Fruits), crop name, price per quintal (in ₹), available quantity (in quintals), harvesting date, location, and upload an image. Once submitted, it will be instantly visible to all retailers on their dashboard. Note: This action is exclusively for Farmers.'
  },
  {
    id: 'f_negotiation',
    title: 'Price Negotiation and Managing Offers (Farmer)',
    category: 'farmer',
    keywords: ['accept offer', 'reject offer', 'manage offers', 'negotiate price', 'buyer proposal', 'bids', 'accept bid', 'reject bid'],
    content: 'When a retailer makes an offer on your crop, you receive a notification. Go to "Manage Offers" to view pending proposals. You can accept the offer (which locks the deal and opens payment for the buyer) or reject it. You can also chat directly with the buyer in the integrated chatroom to negotiate a mutually agreeable price before deciding. Note: Only Farmers can accept or reject offers.'
  },
  {
    id: 'r_browse_crops',
    title: 'How to browse crops and make offers (Retailer)',
    category: 'retailer',
    keywords: ['buy crop', 'browse crops', 'make offer', 'submit bid', 'purchase harvest', 'view crop', 'search crop'],
    content: 'Retailers can view active listings on their home dashboard. Use search filters to sort by category or name. Click "View Details" on a crop to check harvesting date, quantity, farmer name, and location. To place a bid, click "Make Offer", input your target price per quintal and a custom message, and click submit. Note: This action is exclusively for Retailers.'
  },
  {
    id: 'r_manage_offers',
    title: 'How to track placed offers and checkout (Retailer)',
    category: 'retailer',
    keywords: ['my offers', 'offer status', 'accepted offers', 'pay for crop', 'checkout crop', 'purchase status'],
    content: 'Retailers can view all bids they have placed under "My Offers". When a farmer accepts your offer, the status changes to "Accepted" and a green "Pay Now" or checkout button becomes active. Clicking this redirects you to checkout. If a bid is pending, you can use the integrated chat button on the offer card to open a negotiation room and chat directly with the farmer. Note: Tracking offers is exclusively for Retailers.'
  },
  {
    id: 'payment_razorpay',
    title: 'Razorpay Secure Payment & Escrow Settlements',
    category: 'payment',
    keywords: ['payment', 'razorpay', 'pay', 'escrow', 'money transfer', 'credit card', 'upi', 'checkout', 'security', 'refund', 'failed payment'],
    content: 'All transactions are protected by Razorpay. Once a farmer accepts a retailer\'s offer, the retailer goes to the checkout page to pay online using UPI, credit/debit cards, or net banking. The funds are held in secure escrow. They are settled automatically to the farmer\'s wallet or bank account only after the crop is successfully dispatched by the farmer and verified by the retailer, preventing fraud.'
  },
  {
    id: 'delivery_tracking',
    title: 'Real-time Delivery Tracking and GPS',
    category: 'delivery',
    keywords: ['tracking', 'gps', 'delivery', 'live location', 'dispatch', 'transport', 'where is my crop', 'driver map', 'leaflet'],
    content: 'Once payment is processed, the farmer dispatches the crop. Using the "Track Delivery" module in their dashboard, farmers can stream their real-time GPS location via their mobile browser. The retailer can watch the transport movement on an interactive map in real-time. Delivery tracking is collaborative: the farmer updates coordinates while the retailer views the map.'
  },
  {
    id: 'translate_languages',
    title: 'Language Switcher (Multi-lingual platform)',
    category: 'general',
    keywords: ['language', 'translate', 'hindi', 'english', 'marathi', 'tamil', 'google translate', 'dropdown', 'gujarati', 'telugu'],
    content: 'FarmConnect features a universal Google Translate language selector permanently fixed in the top header. Click the globe dropdown to instantly translate the entire app into Hindi, Marathi, Telugu, Tamil, Kannada, or any other regional Indian language.'
  },
  {
    id: 'security_scams',
    title: 'Security and Scam Prevention Guidelines',
    category: 'security',
    keywords: ['scam', 'fraud', 'cheat', 'security', 'fake listing', 'report user', 'stolen money', 'suspicious', 'hack'],
    content: 'We inspect listings for authenticity, but always check ratings before dealing. NEVER pay outside the official Razorpay escrow gateway. If a buyer or seller requests private cash deposits, wire transfers, or external communication channels, report them immediately to support.'
  },
  {
    id: 'general_support',
    title: 'Contacting Support and Ticketing System',
    category: 'general',
    keywords: ['contact support', 'customer care', 'helpdesk', 'serious issue', 'complain', 'admin help', 'ticket', 'escalate'],
    content: 'For simple queries, our AI assistant Ramu is fully trained in RAG. For high-priority issues (payment errors, delivery disputes, fraudulent behavior), our platform has a direct Support Escalation mechanism. You can trigger an official support ticket inside the chatbot, which registers a detailed entry directly in the administrator database for quick resolution.'
  }
];

/**
 * Perform a context retrieval scoped strictly by user role and page situation.
 */
export function retrieveRAGContext(
  queryStr: string,
  userRole?: 'farmer' | 'retailer' | 'guest' | string,
  currentPath?: string
): string {
  const normalizedQuery = queryStr.toLowerCase().trim();
  if (!normalizedQuery) return '';

  const cleanRole = (userRole || 'guest').toLowerCase();
  const cleanPath = (currentPath || '').toLowerCase();

  const scoredArticles = KNOWLEDGE_BASE.map(article => {
    let score = 0;

    // SCENARIO SITUATION FILTERING:
    // Strictly penalize/exclude articles of the opposite role to avoid role confusion.
    if (cleanRole === 'farmer' && article.category === 'retailer') {
      return { article, score: -100 }; // strict penalty
    }
    if (cleanRole === 'retailer' && article.category === 'farmer') {
      return { article, score: -100 }; // strict penalty
    }

    // SITUATIONAL PATH BOOSTING:
    // Boost articles based on where the user currently is in the application.
    if (cleanPath.includes('add-crop') && article.id === 'f_add_crop') {
      score += 15;
    }
    if (cleanPath.includes('farmer/offers') && article.id === 'f_negotiation') {
      score += 15;
    }
    if (cleanPath.includes('retailer/dashboard') && article.id === 'r_browse_crops') {
      score += 15;
    }
    if (cleanPath.includes('retailer/offers') && article.id === 'r_manage_offers') {
      score += 15;
    }
    if (cleanPath.includes('checkout') && article.category === 'payment') {
      score += 15;
    }
    if ((cleanPath.includes('tracking') || cleanPath.includes('delivery')) && article.category === 'delivery') {
      score += 15;
    }

    // Check keyword matches in query
    article.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword)) {
        score += 5; // high weight for keyword exact inclusion
      }
    });

    // Check occurrences in query content words
    const words = normalizedQuery.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        if (article.title.toLowerCase().includes(word)) score += 2.0;
        if (article.content.toLowerCase().includes(word)) score += 0.8;
      }
    });

    return { article, score };
  });

  // Filter articles with score > 0 and sort by highest score
  const matches = scoredArticles
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  let situationalHeader = `User Context Summary:\n- Active User Role: ${cleanRole.toUpperCase()}\n- Current Webpage Route: ${cleanPath || 'Home Page'}\n\n`;

  if (matches.length === 0) {
    // Return a default role-appropriate baseline context
    if (cleanRole === 'farmer') {
      return situationalHeader + `Baseline info: You are assisting a Farmer on FarmConnect. Farmers can list crops for sale, view bids/offers from retailers on their "Manage Offers" page, chat with retailers to negotiate, and stream GPS tracking during crop delivery.`;
    } else if (cleanRole === 'retailer') {
      return situationalHeader + `Baseline info: You are assisting a Retailer on FarmConnect. Retailers can browse active crops on their dashboard, submit bids/offers, track offer status under "My Offers", pay securely via Razorpay escrow when accepted, and view live delivery tracking maps.`;
    } else {
      return situationalHeader + `Baseline info: FarmConnect connects Indian farmers directly with retailers. Farmers list crops and manage bids, while retailers browse and bid. Payments are escrowed via Razorpay, and deliveries are tracked in real-time.`;
    }
  }

  return situationalHeader + matches.map(m => `[Document: ${m.article.title}] ${m.article.content}`).join('\n\n');
}
