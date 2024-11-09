const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Twilio credentials (replace these with your own or store in .env file)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Store OTPs for temporary storage and verification
const otpStore = {};

// Generate a 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Route to send OTP
app.post('/send_otp', (req, res) => {
    const { phone_number: phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    // Generate OTP and store it
    const otp = generateOtp();
    otpStore[phoneNumber] = otp;

    // Send OTP via Twilio
    client.messages.create({
        body: `Your OTP is ${otp}`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
    }).then(() => {
        res.status(200).json({ message: "OTP sent successfully" });
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    });
});

// Route to verify OTP
app.post('/verify_otp', (req, res) => {
    const { phone_number: phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    // Verify OTP
    if (otpStore[phoneNumber] && otpStore[phoneNumber] === parseInt(otp, 10)) {
        delete otpStore[phoneNumber];  // Remove OTP after successful verification
        res.status(200).json({ message: "OTP verified successfully" });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});