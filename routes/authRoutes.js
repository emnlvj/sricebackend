const express = require('express');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Manual Signup Route
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({ fullName, email, phone, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Google Auth Route
router.post('/google', async (req, res) => {
  const { tokenId } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,  // Verify with your client ID
    });
    const payload = ticket.getPayload();

    // Check if user exists in DB
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      // If user doesn't exist, create one
      user = new User({
        fullName: payload.name,
        email: payload.email,
        phone: payload.phone || "N/A", // Assume phone number is not in payload
        password: "google", // or generate a secure random password
      });
      await user.save();
    }

    res.status(200).json({ message: 'User authenticated via Google', user });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed', error });
  }
}); 

router.post('/facebook', async (req, res) => {
  const { userID, accessToken } = req.body;

  try {
    const response = await fetch(`https://graph.facebook.com/${userID}?fields=id,name,email&access_token=${accessToken}`);

    const fbData = await response.json();

    if (!fbData || fbData.error) {
      return res.status(400).json({ message: 'Invalid Facebook credentials', error: fbData.error });
    }

    // Check if user exists
    let user = await User.findOne({ email: fbData.email });
    if (!user) {
      user = new User({
        fullName: fbData.name,
        email: fbData.email,
        phone: "N/A", // Facebook API doesn't return phone
        password: "facebook"
      });
      await user.save();
    }

    res.status(200).json({ message: 'User authenticated via Facebook', user });
  } catch (error) {
    res.status(500).json({ message: 'Facebook authentication failed', error });
  }
});
module.exports = router;