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
    keywords: ['add crop', 'list crop', 'sell harvest', 'sell crop', 'upload crop', 'post crop'],
    content: 'Farmers can list crops by clicking "Add Crop" in the top bar. You must specify the crop category (e.g., Grains, Vegetables, Fruits), crop name, price per quintal (in ₹), available quantity (in quintals), harvesting date, location, and upload an image. Once submitted, it will be instantly visible to all retailers on their dashboard.'
  },
  {
    id: 'f_negotiation',
    title: 'Price Negotiation and Managing Offers (Farmer)',
    category: 'farmer',
    keywords: ['accept offer', 'reject offer', 'manage offers', 'negotiate price', 'buyer proposal', 'bids'],
    content: 'When a retailer makes an offer on your crop, you receive a notification. Go to "Manage Offers" to view pending proposals. You can accept the offer (which locks the deal and opens payment for the buyer) or reject it. You can also chat directly with the buyer to negotiate a mutually agreeable price before deciding.'
  },
  {
    id: 'r_browse_crops',
    title: 'How to browse crops and make offers (Retailer)',
    category: 'retailer',
    keywords: ['buy crop', 'browse crops', 'make offer', 'submit bid', 'purchase harvest'],
    content: 'Retailers can view active listings on their home dashboard. Use search filters to sort by category or name. Click "View Details" on a crop to check harvesting date, quantity, farmer name, and location. To place a bid, click "Make Offer", input your target price per quintal and a custom message, and click submit.'
  },
  {
    id: 'payment_razorpay',
    title: 'Razorpay Secure Payment & Escrow Settlements',
    category: 'payment',
    keywords: ['payment', 'razorpay', 'pay', 'escrow', 'money transfer', 'credit card', 'upi', 'checkout', 'security'],
    content: 'All transactions are protected by Razorpay. Once a farmer accepts your offer, the retailer goes to "Checkout" to pay online using UPI, cards, or net banking. The funds are held in secure escrow and are settled automatically to the farmer after the crop is successfully dispatched and verified.'
  },
  {
    id: 'delivery_tracking',
    title: 'Real-time Delivery Tracking and GPS',
    category: 'delivery',
    keywords: ['tracking', 'gps', 'delivery', 'live location', 'dispatch', 'transport', 'where is my crop'],
    content: 'Once payment is processed, the farmer dispatches the crop. Using the "Track Delivery" module in their dashboard, farmers can stream their real-time GPS location via their mobile browser. The retailer can watch the transport movement on an interactive map in real-time, ensuring transparency.'
  },
  {
    id: 'translate_languages',
    title: 'Language Switcher (Multi-lingual platform)',
    category: 'general',
    keywords: ['language', 'translate', 'hindi', 'english', 'marathi', 'tamil', 'google translate', 'dropdown'],
    content: 'FarmConnect features a universal Google Translate language selector permanently fixed in the top header. Click the globe dropdown to instantly translate the entire app into Hindi, Marathi, Telugu, Tamil, Kannada, or any other regional Indian language.'
  },
  {
    id: 'security_scams',
    title: 'Security and Scam Prevention Guidelines',
    category: 'security',
    keywords: ['scam', 'fraud', 'cheat', 'security', 'fake listing', 'report user', 'stolen money', 'suspicious'],
    content: 'We inspect listings for authenticity, but always check farmer/retailer ratings before dealing. NEVER pay outside the official Razorpay escrow gateway. If a buyer or seller requests private cash deposits, wire transfers, or external communication channels, report them immediately. Real-time updates and ratings are guarded strictly.'
  },
  {
    id: 'general_support',
    title: 'Contacting Support and Ticketing System',
    category: 'general',
    keywords: ['contact support', 'customer care', 'helpdesk', 'serious issue', 'complain', 'admin help', 'ticket'],
    content: 'For simple queries, this AI assistant is fully trained in RAG. For high-priority issues (payment errors, delivery disputes, fraudulent behavior), our platform has a direct Support Escalation mechanism. You can trigger an official support ticket, which registers a detailed entry directly in the administrator database for quick resolution.'
  }
];

/**
 * Perform a keyword density and score matching retriever (RAG) over the knowledge database.
 */
export function retrieveRAGContext(queryStr: string): string {
  const normalizedQuery = queryStr.toLowerCase().trim();
  if (!normalizedQuery) return '';

  const scoredArticles = KNOWLEDGE_BASE.map(article => {
    let score = 0;
    
    // Check keyword matches
    article.keywords.forEach(keyword => {
      if (normalizedQuery.includes(keyword)) {
        score += 3; // high weight for keyword exact inclusion
      }
    });

    // Check occurrences in content
    const words = normalizedQuery.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        if (article.title.toLowerCase().includes(word)) score += 1.5;
        if (article.content.toLowerCase().includes(word)) score += 0.5;
      }
    });

    return { article, score };
  });

  // Filter articles with score > 0 and sort by highest score
  const matches = scoredArticles
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Retrieve top 2 matching contexts

  if (matches.length === 0) {
    // Return a default baseline context to guide the bot's standard behavior
    return `Baseline info: FarmConnect is a direct farmer-to-retailer marketplace in India featuring Razorpay payments, real-time negotiation chats, multi-lingual translations, and Leaflet GPS delivery maps.`;
  }

  return matches.map(m => `[Document: ${m.article.title}] ${m.article.content}`).join('\n\n');
}
