// ...existing code...
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

if (!process.env.VERCEL) {
  require('dotenv').config();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

function normalizePrivateKey(pk) {
  if (!pk) return '';
  return pk.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_EMAIL_10M = 5;
const MAX_VERIFY_ATTEMPTS = 6;
const ENABLE_LOGS = process.env.ENABLE_LOGS === 'true';
const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
const otps = {};

function log(...args) {
  if (ENABLE_LOGS) console.log(...args);
}
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log('[MAIL] Transport ready'))
  .catch(err => console.error('[MAIL] Transport verify failed:', err.message));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

setInterval(() => {
  const now = Date.now();
  Object.keys(otps).forEach(email => {
    if (now > otps[email].expires) delete otps[email];
  });
}, 5 * 60 * 1000);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/request-otp', otpRequestLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }
    const now = Date.now();
    const record = otps[email] || { history: [], attempts: 0 };
    record.history = (record.history || []).filter(ts => now - ts < 10 * 60 * 1000);
    if (record.history.length >= MAX_REQUESTS_PER_EMAIL_10M) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests. Try later.' });
    }

    const otp = generateOtp();
    otps[email] = {
      otp,
      expires: now + OTP_TTL_MS,
      attempts: 0,
      history: [...record.history, now],
      verified: false,
    };

    await transporter.sendMail({
      from: `"FarmConnect OTP" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your FarmConnect OTP',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    log('[OTP][SENT]', email);
    res.json({ success: true });
  } catch (err) {
    console.error('[OTP][REQUEST] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otps[email];
    if (!record) return res.json({ success: false, error: 'OTP not found' });
    if (Date.now() > record.expires) {
      delete otps[email];
      return res.json({ success: false, error: 'OTP expired' });
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      delete otps[email];
      return res.json({ success: false, error: 'Too many attempts' });
    }
    record.attempts++;
    if (otp !== record.otp) {
      return res.json({ success: false, error: 'Invalid OTP' });
    }
    record.verified = true;
    res.json({ success: true });
  } catch (err) {
    console.error('[OTP][VERIFY] Error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

async function sendGreetingEmail(email, name = '') {
  const message = `
    Hello${name ? ' ' + name : ''},

    Welcome to FarmConnect! We're excited to have you join our community of farmers and retailers.
    With FarmConnect, you can easily list your crops, connect with buyers, and manage your transactions securely.
    Explore our platform to discover new opportunities and make the most of your harvest.
    If you have any questions or need support, our team is here to help.

    Happy farming!
    The FarmConnect Team
  `;
  await transporter.sendMail({
    from: `"FarmConnect" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to FarmConnect!',
    text: message,
  });
}

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    try {
      await sendGreetingEmail(email, name);
      console.log(`[GREETING] Sent to ${email}`);
    } catch (mailErr) {
      console.error(`[GREETING][ERROR] Failed to send greeting to ${email}:`, mailErr.message);
      return res.status(500).json({ success: false, error: 'User created, but greeting email failed.' });
    }
    res.json({ success: true, uid: userRecord.uid });
  } catch (err) {
    console.error('[REGISTER][ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const record = otps[email];
    if (!record) return res.json({ success: false, error: 'OTP not found' });
    if (Date.now() > record.expires) {
      delete otps[email];
      return res.json({ success: false, error: 'OTP expired' });
    }
    if (otp !== record.otp || !record.verified) {
      return res.json({ success: false, error: 'OTP not verified' });
    }

    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch {
      return res.json({ success: false, error: 'User not found' });
    }

    await admin.auth().updateUser(user.uid, { password: newPassword });
    delete otps[email];
    log('[RESET] Password updated', email);
    res.json({ success: true });
  } catch (err) {
    console.error('[RESET] Error:', err);
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    if (!receipt) {
      return res.status(400).json({ success: false, error: 'Receipt required' });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, error: 'Razorpay not configured' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: 1,
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error('[ORDER] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/mark-transaction-completed', (req, res) => {
  const { transactionId } = req.body;
  log('[TXN][COMPLETE]', transactionId);
  res.json({ success: true });
});

app.post('/mark-crop-sold', async (req, res) => {
  try {
    const { cropId } = req.body;
    if (!cropId) return res.status(400).json({ success: false, error: 'cropId required' });
    await admin.firestore().collection('crops').doc(cropId).update({ status: 'sold' });
    res.json({ success: true });
  } catch (err) {
    console.error('[CROP][SOLD] Error:', err);
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED]', err);
  res.status(500).json({ success: false, error: 'Server error' });
});

module.exports = serverless(app);