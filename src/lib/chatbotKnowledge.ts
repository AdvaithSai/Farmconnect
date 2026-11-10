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

// Which article describes the page the user is on.
const PAGE_ARTICLES: [pathPart: string, articleId: string][] = [
  ['add-crop', 'f_add_crop'],
  ['farmer/offers', 'f_negotiation'],
  ['retailer/dashboard', 'r_browse_crops'],
  ['retailer/crop', 'r_browse_crops'],
  ['retailer/offers', 'r_manage_offers'],
  ['checkout', 'payment_razorpay'],
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'can', 'you', 'how', 'what', 'when', 'where', 'who', 'why', 'which',
  'does', 'did', 'will', 'would', 'should', 'could', 'with', 'this', 'that', 'there', 'here', 'have',
  'has', 'was', 'not', 'any', 'all', 'from', 'about', 'into', 'want', 'need', 'please', 'tell', 'ramu',
  'get', 'use', 'using', 'its', 'our', 'your', 'they', 'them', 'page', 'help', 'farmconnect',
]);

// Meaningful words of a text, lightly stemmed so "offers" matches "offer".
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter(word => word.length > 2 && !STOPWORDS.has(word))
    .map(word => word.replace(/(ing|s)$/, ''));
}

const containsToken = (text: string, token: string) => tokenize(text).includes(token);

const isOtherRole = (article: KnowledgeArticle, role: string) =>
  (role === 'farmer' && article.category === 'retailer') ||
  (role === 'retailer' && article.category === 'farmer');

/**
 * Articles relevant to the question, best first. The question decides the
 * ranking; the current page only breaks ties, and answers vague questions
 * like "what can I do here?".
 */
export function findArticles(queryStr: string, userRole?: string, currentPath?: string): KnowledgeArticle[] {
  const query = queryStr.toLowerCase().trim();
  const role = (userRole || 'guest').toLowerCase();
  const path = (currentPath || '').toLowerCase();
  const tokens = tokenize(query);
  const pageArticleId = PAGE_ARTICLES.find(([part]) => path.includes(part))?.[1];
  const candidates = KNOWLEDGE_BASE.filter(article => !isOtherRole(article, role));

  const scored = candidates
    .map(article => {
      let score = 0;
      article.keywords.forEach(keyword => {
        if (query.includes(keyword)) score += 5; // whole phrase asked for
      });
      tokens.forEach(token => {
        if (article.keywords.some(keyword => containsToken(keyword, token))) score += 2;
        if (containsToken(article.title, token)) score += 2;
        if (containsToken(article.content, token)) score += 0.5;
      });
      if (score > 0 && article.id === pageArticleId) score += 1; // tie-break only
      return { article, score };
    })
    .filter(item => item.score >= 2)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Nothing in the question matched: only fall back to the page for "here"-type questions.
    const asksAboutPage = /\b(here|this page|this screen|what (can|do|should) i do)\b/.test(query);
    const pageArticle = candidates.find(article => article.id === pageArticleId);
    return asksAboutPage && pageArticle ? [pageArticle] : [];
  }
  // Keep a second article only if it is nearly as relevant as the first.
  return scored.filter(item => item.score >= scored[0].score * 0.6).slice(0, 2).map(item => item.article);
}

/**
 * Answer without the AI backend: the sentences of the best article that
 * address the question. Returns null when nothing relevant is known.
 */
export function answerLocally(queryStr: string, userRole?: string, currentPath?: string): string | null {
  // Best match across both roles, so a retailer asking about a farmer-only
  // action is told so instead of getting an unrelated retailer answer.
  const role = (userRole || 'guest').toLowerCase();
  const [article] = findArticles(queryStr, 'guest', currentPath);
  if (!article) return null;
  const prefix = isOtherRole(article, role) ? `That is done by ${article.category}s, not ${role}s. ` : '';

  const tokens = tokenize(queryStr);
  const sentences = article.content.split(/(?<=[.!?])\s+/).filter(sentence => !sentence.startsWith('Note:'));
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      hits: tokens.filter(token => containsToken(sentence, token)).length,
    }))
    .filter(item => item.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);

  return prefix + (ranked.length > 0 ? ranked.map(item => item.sentence) : sentences.slice(0, 2)).join(' ');
}

/**
 * Context handed to the AI backend: the relevant articles, or a role baseline.
 */
export function retrieveRAGContext(queryStr: string, userRole?: string, currentPath?: string): string {
  const role = (userRole || 'guest').toLowerCase();
  const header = `User role: ${role}\nCurrent page: ${currentPath || '/'}\n\n`;
  const articles = findArticles(queryStr, role, currentPath);

  if (articles.length > 0) {
    return header + articles.map(article => `[${article.title}] ${article.content}`).join('\n\n');
  }
  if (role === 'farmer') {
    return header + 'Farmers can list crops for sale, view offers from retailers on their "Manage Offers" page, chat with retailers to negotiate, and share live GPS tracking during crop delivery.';
  }
  if (role === 'retailer') {
    return header + 'Retailers can browse crops on their dashboard, make offers, track them under "My Offers", pay through Razorpay once an offer is accepted, and follow the delivery on a live map.';
  }
  return header + 'FarmConnect connects Indian farmers directly with retailers. Farmers list crops and manage offers, retailers browse and make offers, payments go through Razorpay, and deliveries are tracked live.';
}
