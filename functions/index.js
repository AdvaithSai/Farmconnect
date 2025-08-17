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