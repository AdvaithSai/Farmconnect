const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});

const firestoreDb = admin.firestore();

const otps = {}; // In-memory OTP store; swap for Redis/DB in production
const otpRequests = {}; // email -> { count, windowStart }

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5; // wrong guesses allowed per OTP
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_REQUESTS_PER_HOUR = 5;

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const isDocId = (id) => typeof id === 'string' && id.length > 0 && !id.includes('/');

// Checks an OTP guess. Wrong guesses are counted and the OTP is burned after
// OTP_MAX_ATTEMPTS, so a 6-digit code cannot be brute-forced.
function checkOtp(email, otp) {
  const record = otps[email];
  if (!record) return 'OTP not found. Please request a new one.';
  if (Date.now() > record.expires) {
    delete otps[email];
    return 'OTP expired. Please request a new one.';
  }
  const guess = Buffer.from(String(otp ?? ''));
  const actual = Buffer.from(record.otp);
  if (guess.length !== actual.length || !crypto.timingSafeEqual(guess, actual)) {
    record.attempts += 1;
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      delete otps[email];
      return 'Too many incorrect attempts. Please request a new OTP.';
    }
    return 'Invalid OTP';
  }
  return null;
}

// Requires a Firebase ID token; sets req.uid to the verified caller.
async function requireAuth(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ success: false, error: 'Sign in required' });
  try {
    req.uid = (await admin.auth().verifyIdToken(match[1])).uid;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_PASS || '').replace(/\s+/g, ''),
  },
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── OTP / Auth ──────────────────────────────────────────────────────────────

// 1. Request OTP
app.post('/request-otp', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  const now = Date.now();
  const existing = otps[email];
  if (existing && now - existing.sentAt < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ success: false, error: 'Please wait a minute before requesting another OTP.' });
  }
  let requests = otpRequests[email];
  if (!requests || now - requests.windowStart > 60 * 60 * 1000) {
    requests = otpRequests[email] = { count: 0, windowStart: now };
  }
  if (requests.count >= OTP_MAX_REQUESTS_PER_HOUR) {
    return res.status(429).json({ success: false, error: 'Too many OTP requests. Please try again later.' });
  }
  requests.count += 1;

  const otp = crypto.randomInt(100000, 1000000).toString();
  otps[email] = { otp, expires: now + OTP_TTL_MS, sentAt: now, attempts: 0 };

  try {
    await transporter.sendMail({
      from: `"FarmConnect" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your FarmConnect OTP Code',
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your FarmConnect OTP code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP email' });
  }
});

// 2. Verify OTP
app.post('/verify-otp', (req, res) => {
  const error = checkOtp(normalizeEmail(req.body.email), req.body.otp);
  if (error) return res.json({ success: false, error });
  res.json({ success: true });
});

// 3. Reset Password — now actually updates Firebase Auth
app.post('/reset-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { otp, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.json({ success: false, error: 'Password must be at least 6 characters' });
  }
  const error = checkOtp(email, otp);
  if (error) return res.json({ success: false, error });

  delete otps[email]; // single use, even if the update below fails
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to reset password:', err);
    res.json({ success: false, error: 'Failed to reset password' });
  }
});

// ─── Razorpay ────────────────────────────────────────────────────────────────

// Expose Razorpay Key ID for frontend
app.get('/razorpay-key', (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    console.error('RAZORPAY_KEY_ID is not configured');
    return res.status(500).json({ success: false, error: 'Razorpay key not configured' });
  }
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// Create Razorpay order. The amount is computed here from the accepted offer
// in Firestore; nothing the browser sends decides what gets charged.
app.post('/create-order', requireAuth, async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not configured');
    return res.status(500).json({ success: false, error: 'Payment gateway not properly configured' });
  }

  const { offerId } = req.body;
  if (!isDocId(offerId)) {
    return res.status(400).json({ success: false, error: 'offerId is required' });
  }

  try {
    const offerSnap = await firestoreDb.collection('offers').doc(offerId).get();
    const offer = offerSnap.data();
    if (!offer || offer.retailer_id !== req.uid) {
      return res.status(403).json({ success: false, error: 'This offer does not belong to you' });
    }
    if (offer.status !== 'accepted') {
      return res.status(409).json({ success: false, error: 'This offer has not been accepted' });
    }
    const cropSnap = await firestoreDb.collection('crops').doc(offer.crop_id).get();
    const crop = cropSnap.data();
    if (!crop) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }
    if (crop.status === 'sold') {
      return res.status(409).json({ success: false, error: 'This crop has already been paid for' });
    }

    const amount = Math.round(Number(offer.price) * (Number(crop.quantity) || 1) * 100); // paise
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Offer has an invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: offerId,
      payment_capture: 1,
      notes: { offerId },
    });
    console.log('[create-order] order', order.id, 'for offer', offerId);
    res.json({ success: true, order });
  } catch (err) {
    console.error('[create-order] error:', err);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Verify a Razorpay payment and record it. This is the only way a transaction
// becomes 'completed' or a crop becomes 'sold'.
app.post('/verify-payment', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((v) => typeof v === 'string' && v)) {
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const given = Buffer.from(razorpay_signature);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, Buffer.from(expected))) {
    return res.status(400).json({ success: false, error: 'Payment signature is invalid' });
  }

  try {
    // The order (created by us above) says which offer was paid for.
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const offerId = order.notes && order.notes.offerId;
    if (!isDocId(offerId)) {
      return res.status(400).json({ success: false, error: 'Order is not linked to an offer' });
    }
    const offerSnap = await firestoreDb.collection('offers').doc(offerId).get();
    const offer = offerSnap.data();
    if (!offer || offer.retailer_id !== req.uid) {
      return res.status(403).json({ success: false, error: 'This offer does not belong to you' });
    }

    const txSnap = await firestoreDb.collection('transactions').where('offer_id', '==', offerId).get();
    const batch = firestoreDb.batch();
    txSnap.forEach((tx) => {
      if (tx.get('status') === 'pending_payment') {
        batch.update(tx.ref, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          razorpay_order_id,
          razorpay_payment_id,
        });
      }
    });
    batch.update(firestoreDb.collection('crops').doc(offer.crop_id), { status: 'sold' });
    await batch.commit();

    console.log('[verify-payment] recorded payment', razorpay_payment_id, 'for offer', offerId);
    res.json({ success: true, offerId, cropId: offer.crop_id });
  } catch (err) {
    console.error('[verify-payment] error:', err);
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

// ─── Delivery Tracking ───────────────────────────────────────────────────────

// Returns the tracking doc ref if the caller is the given party on it
// ('farmer_id' or 'retailer_id'); otherwise sends the error and returns null.
async function trackingRefFor(req, res, partyField) {
  const { transactionId } = req.body;
  if (!isDocId(transactionId)) {
    res.status(400).json({ success: false, error: 'transactionId is required' });
    return null;
  }
  const ref = firestoreDb.collection('delivery_tracking').doc(transactionId);
  const snap = await ref.get();
  if (!snap.exists || snap.get(partyField) !== req.uid) {
    res.status(403).json({ success: false, error: 'Not allowed for this delivery' });
    return null;
  }
  return ref;
}

// Update farmer GPS location for delivery tracking
app.post('/update-location', requireAuth, async (req, res) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ success: false, error: 'latitude and longitude are required' });
  }
  try {
    const ref = await trackingRefFor(req, res, 'farmer_id');
    if (!ref) return;
    await ref.update({
      location_latitude: latitude,
      location_longitude: longitude,
      last_updated: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[update-location] error:', err);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
});

// Mark delivery as completed by farmer
app.post('/mark-delivery-completed', requireAuth, async (req, res) => {
  try {
    const ref = await trackingRefFor(req, res, 'farmer_id');
    if (!ref) return;
    await ref.update({ status: 'delivered', delivered_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    console.error('[mark-delivery-completed] error:', err);
    res.status(500).json({ success: false, error: 'Failed to update delivery' });
  }
});

// Acknowledge delivery receipt by retailer
app.post('/acknowledge-delivery', requireAuth, async (req, res) => {
  try {
    const ref = await trackingRefFor(req, res, 'retailer_id');
    if (!ref) return;
    await ref.update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    console.error('[acknowledge-delivery] error:', err);
    res.status(500).json({ success: false, error: 'Failed to update delivery' });
  }
});

// ─── AI Chatbot RAG Route ───────────────────────────────────────────────────
app.post('/api/ai-chat', async (req, res) => {
  const { query, context, userName, userRole } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ 
      success: false, 
      error: 'GEMINI_API_KEY is not configured on the server, using high-fidelity local RAG processing.' 
    });
  }

  const systemInstruction = `You are Ramu, the FarmConnect AI Assistant, a friendly and warm agricultural expert.
Use the following retrieved context documents to answer the user's questions accurately.
Only provide advice matching the user's specific situation and role: they are a ${userRole.toUpperCase()}. Do NOT provide guidelines meant for the other role unless explicitly asked.
If the retrieved context does not contain enough info, or the question is unrelated to the website, politely explain that you are Ramu, specialized strictly in FarmConnect direct farmer-to-retailer commerce topics.

Retrieved Website Context:
${context}

User Information:
Name: ${userName}
Role: ${userRole}

Answer the query professionally, warmly, and concisely, tailored strictly to their role context. Always introduce yourself or sign off as Ramu.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: `User Question: ${query}` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const reply = data.candidates[0].content.parts[0].text;
      res.json({ success: true, reply });
    } else {
      console.error('Gemini API Error Response:', data);
      res.json({ success: false, error: 'Empty or invalid response from Gemini API' });
    }
  } catch (err) {
    console.error('Failed to query Gemini API:', err);
    res.json({ success: false, error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FarmConnect backend running on port ${PORT}`);
});