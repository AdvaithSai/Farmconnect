const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
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
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

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
  const { email, otp } = req.body;
  const record = otps[email];
  if (!record) return res.json({ success: false, error: 'OTP not found' });
  if (Date.now() > record.expires) return res.json({ success: false, error: 'OTP expired' });
  if (otp !== record.otp) return res.json({ success: false, error: 'Invalid OTP' });
  res.json({ success: true });
});

// 3. Reset Password — now actually updates Firebase Auth
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otps[email];
  if (!record) return res.json({ success: false, error: 'OTP not found' });
  if (Date.now() > record.expires) return res.json({ success: false, error: 'OTP expired' });
  if (otp !== record.otp) return res.json({ success: false, error: 'Invalid OTP' });

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
    delete otps[email];
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to reset password:', err);
    res.json({ success: false, error: err.message });
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

// Create Razorpay order
app.post('/create-order', async (req, res) => {
  console.log('Received order creation request:', req.body);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not configured');
    return res.status(500).json({ success: false, error: 'Payment gateway not properly configured' });
  }

  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount provided' });
  }
  if (!receipt) {
    return res.status(400).json({ success: false, error: 'Receipt ID is required' });
  }

  try {
    const orderData = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt,
      payment_capture: 1,
    };
    console.log('Creating Razorpay order:', orderData);
    const order = await razorpay.orders.create(orderData);
    console.log('Order created:', order.id);
    res.json({ success: true, order });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Post-Payment Database Updates ──────────────────────────────────────────

// Mark transaction as completed after successful payment
app.post('/mark-transaction-completed', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'transactionId is required' });
  }
  console.log('[mark-transaction-completed] transactionId:', transactionId);
  try {
    await firestoreDb.collection('transactions').doc(transactionId).update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    console.log('[mark-transaction-completed] success');
    res.json({ success: true });
  } catch (err) {
    console.error('[mark-transaction-completed] error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark crop as sold after successful payment
app.post('/mark-crop-sold', async (req, res) => {
  const { cropId } = req.body;
  if (!cropId) {
    return res.status(400).json({ success: false, error: 'cropId is required' });
  }
  console.log('[mark-crop-sold] cropId:', cropId);
  try {
    await firestoreDb.collection('crops').doc(cropId).update({
      status: 'sold',
    });
    console.log('[mark-crop-sold] success');
    res.json({ success: true });
  } catch (err) {
    console.error('[mark-crop-sold] error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Delivery Tracking ───────────────────────────────────────────────────────

// Update farmer GPS location for delivery tracking
app.post('/update-location', async (req, res) => {
  const { transactionId, latitude, longitude } = req.body;
  if (!transactionId || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, error: 'transactionId, latitude, and longitude are required' });
  }
  console.log('[update-location] transactionId:', transactionId, 'location:', latitude, longitude);
  try {
    await firestoreDb.collection('delivery_tracking').doc(transactionId).update({
      location_latitude: latitude,
      location_longitude: longitude,
      last_updated: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[update-location] error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark delivery as completed by farmer
app.post('/mark-delivery-completed', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'transactionId is required' });
  }
  console.log('[mark-delivery-completed] transactionId:', transactionId);
  try {
    await firestoreDb.collection('delivery_tracking').doc(transactionId).update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[mark-delivery-completed] error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Acknowledge delivery receipt by retailer
app.post('/acknowledge-delivery', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'transactionId is required' });
  }
  console.log('[acknowledge-delivery] transactionId:', transactionId);
  try {
    await firestoreDb.collection('delivery_tracking').doc(transactionId).update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[acknowledge-delivery] error:', err);
    res.status(500).json({ success: false, error: err.message });
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

  const systemInstruction = `You are the FarmConnect AI Assistant, a friendly customer helper trained on the website.
Use the following retrieved context documents to answer the user's questions accurately.
If the retrieved context does not contain enough info, or the question is unrelated to the website, politely explain that you are specialized in FarmConnect direct commerce topics.

Retrieved Website Context:
${context}

User Information:
Name: ${userName}
Role: ${userRole}

Answer the query professionally. Be concise and keep formatting clear.`;

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