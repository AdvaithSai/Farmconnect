// Endpoint to mark crop as sold
exports.markCropSold = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    const { cropId } = req.body;
    if (!cropId) {
      return res.status(400).json({ success: false, message: 'Missing cropId' });
    }
    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      const db = admin.firestore();
      const cropRef = db.collection('crops').doc(cropId);
      await cropRef.update({ status: 'sold' });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error marking crop as sold:', error);
      return res.status(500).json({ success: false, message: error.toString() });
    }
  });
});
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// Use environment variables for security
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.password;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPass,
  },
});

exports.sendOtpEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).send('Missing email or otp');
    }
    const mailOptions = {
      from: gmailEmail,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };
    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).send('OTP sent');
    } catch (error) {
      return res.status(500).send(error.toString());
    }
  });
}); 