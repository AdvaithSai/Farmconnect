const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
// Temporarily comment out Firebase admin to focus on payment functionality
// const admin = require('firebase-admin');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Temporarily comment out Firebase initialization
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID || 'farmer-d3cc7',
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@farmer-d3cc7.iam.gserviceaccount.com',
//     privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
//   }),
// });

const otps = {}; // In-memory store for demo; use a DB for production

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Request OTP
app.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

  await transporter.sendMail({
    from: `"Your App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  });

  res.json({ success: true });
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

// 3. Reset Password
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otps[email];
  if (!record) return res.json({ success: false, error: 'OTP not found' });
  if (Date.now() > record.expires) return res.json({ success: false, error: 'OTP expired' });
  if (otp !== record.otp) return res.json({ success: false, error: 'Invalid OTP' });

  // Temporarily comment out Firebase auth operations
  // try {
  //   const user = await admin.auth().getUserByEmail(email);
  //   await admin.auth().updateUser(user.uid, { password: newPassword });
  //   delete otps[email];
  //   res.json({ success: true });
  // } catch (err) {
  //   res.json({ success: false, error: err.message });
  // }
  
  // For now, just return success
  delete otps[email];
  res.json({ success: true, message: 'Password reset functionality temporarily disabled' });
});

// Create Razorpay order
app.post('/create-order', async (req, res) => {
  console.log('Received order creation request:', req.body);
  
  // Validate Razorpay configuration
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not properly configured');
    return res.status(500).json({ 
      success: false, 
      error: 'Payment gateway not properly configured' 
    });
  }
  
  console.log('Razorpay key ID:', process.env.RAZORPAY_KEY_ID);
  console.log('Razorpay key secret length:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0);
  
  const { amount, currency = 'INR', receipt } = req.body;
  
  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    console.error('Invalid amount provided:', amount);
    return res.status(400).json({ success: false, error: 'Invalid amount provided' });
  }
  
  // Validate receipt
  if (!receipt) {
    console.error('No receipt ID provided');
    return res.status(400).json({ success: false, error: 'Receipt ID is required' });
  }
  
  try {
    // Prepare order data
    const orderData = {
      amount: Math.round(amount * 100), // amount in paise, ensure it's an integer
      currency,
      receipt,
      payment_capture: 1
    };
    
    console.log('Creating Razorpay order with:', orderData);
    
    // Create order
    const order = await razorpay.orders.create(orderData);
    
    console.log('Order created successfully:', order);
    res.json({ success: true, order });
  
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Expose Razorpay Key ID for frontend
app.get('/razorpay-key', (req, res) => {
  console.log('Razorpay key requested');
  
  // Check if Razorpay key is configured
  if (!process.env.RAZORPAY_KEY_ID) {
    console.error('RAZORPAY_KEY_ID is not defined in environment variables');
    return res.status(500).json({ success: false, error: 'Razorpay key not configured' });
  }
  
  console.log('Returning Razorpay key ID:', process.env.RAZORPAY_KEY_ID);
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// Mark transaction as completed after payment
app.post('/mark-transaction-completed', async (req, res) => {
  const { transactionId } = req.body;
  // Temporarily comment out Firebase operations
  // try {
  //   await admin.firestore().collection('transactions').doc(transactionId).update({
  //     status: 'completed'
  //   });
  //   res.json({ success: true });
  // } catch (err) {
  //   res.json({ success: false, error: err.message });
  // }
  
  // For now, just return success
  console.log('Transaction marked as completed (mock):', transactionId);
  res.json({ success: true, message: 'Transaction marked as completed (mock)' });
});

// Mark crop as sold
app.post('/mark-crop-sold', async (req, res) => {
  const { cropId } = req.body;
  console.log('[mark-crop-sold] cropId:', cropId);
  // Temporarily comment out Firebase operations
  // try {
  //   const result = await admin.firestore().collection('crops').doc(cropId).update({
  //     status: 'sold'
  //   });
  //   console.log('[mark-crop-sold] update result:', result);
  //   res.json({ success: true });
  // } catch (err) {
  //   console.error('[mark-crop-sold] error:', err);
  //   res.json({ success: false, error: err.message });
  // }
  
  // For now, just return success
  console.log('Crop marked as sold (mock):', cropId);
  res.json({ success: true, message: 'Crop marked as sold (mock)' });
});

// Update farmer location for delivery tracking
app.post('/update-location', async (req, res) => {
  const { transactionId, latitude, longitude } = req.body;
  console.log('[update-location] transactionId:', transactionId, 'location:', latitude, longitude);
  try {
    await admin.firestore().collection('delivery_tracking').doc(transactionId).update({
      location_latitude: latitude,
      location_longitude: longitude,
      last_updated: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[update-location] error:', err);
    res.json({ success: false, error: err.message });
  }
});

// Mark delivery as completed by farmer
app.post('/mark-delivery-completed', async (req, res) => {
  const { transactionId } = req.body;
  console.log('[mark-delivery-completed] transactionId:', transactionId);
  try {
    await admin.firestore().collection('delivery_tracking').doc(transactionId).update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[mark-delivery-completed] error:', err);
    res.json({ success: false, error: err.message });
  }
});

// Acknowledge delivery receipt by retailer
app.post('/acknowledge-delivery', async (req, res) => {
  const { transactionId } = req.body;
  console.log('[acknowledge-delivery] transactionId:', transactionId);
  try {
    await admin.firestore().collection('delivery_tracking').doc(transactionId).update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[acknowledge-delivery] error:', err);
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});