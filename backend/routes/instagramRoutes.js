const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Customer } = require('../models');

// Initiates the Facebook OAuth flow for Instagram Business
// Expects customerId (which is the whatsAppNumber) to track which customer is connecting
router.get('/auth', (req, res) => {
  const { customerId } = req.query;
  
  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'META_APP_ID and META_REDIRECT_URI must be configured in .env' });
  }

  // Pass the customerId in the state parameter
  const state = encodeURIComponent(customerId);
  // Scopes required for Instagram Graph API
  const scope = 'instagram_basic,instagram_manage_comments,instagram_manage_insights,instagram_content_publish,instagram_manage_messages,pages_show_list,pages_read_engagement';

  // Facebook Login Dialog URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&display=page&extras={"setup":{"channel":"IG_API"}}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;

  res.json({ url: authUrl });
});

// Callback route where Meta redirects after successful login
router.get('/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;

  if (error) {
    console.error('Facebook OAuth Error:', error, error_reason, error_description);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=instagram_auth_failed`);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state parameter');
  }

  const customerId = decodeURIComponent(state);

  try {
    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    // 1. Exchange code for short-lived access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: clientId,
        redirect_uri: redirectUri,
        client_secret: clientSecret,
        code: code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;
    let longLivedToken = shortLivedToken;

    // 2. Exchange for a long-lived token (Graph API)
    try {
      const longLivedResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortLivedToken
        }
      });
      longLivedToken = longLivedResponse.data.access_token;
    } catch (longLivedErr) {
      console.warn('Could not exchange for long-lived token, using short-lived:', longLivedErr.response?.data || longLivedErr.message);
    }
    
    // We don't get userId directly from the token response in standard FB login
    // We can query /me to get the user ID if needed, but for now we just save the token
    let fbUserId = null;
    try {
        const meResponse = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${longLivedToken}`);
        fbUserId = meResponse.data.id;
    } catch (e) {
        console.warn('Could not fetch user ID:', e.response?.data || e.message);
    }

    // 3. Save to database
    const customer = await Customer.findOne({ where: { whatsAppNumber: customerId } });
    if (customer) {
      customer.instagramAccessToken = longLivedToken;
      if (fbUserId) {
        customer.instagramAccountId = fbUserId;
      }
      await customer.save();
    } else {
      console.error('Customer not found for Instagram auth callback:', customerId);
    }

    // 4. Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?success=instagram_connected`);

  } catch (err) {
    console.error('Instagram Token Exchange Error:', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=instagram_token_exchange_failed`);
  }
});

module.exports = router;
