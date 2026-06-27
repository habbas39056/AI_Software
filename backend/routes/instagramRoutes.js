const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Customer } = require('../models');

// Initiates the Instagram OAuth flow
// Expects customerId (which is the whatsAppNumber) to track which customer is connecting
router.get('/auth', (req, res) => {
  const { customerId } = req.query;
  
  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  const clientId = process.env.META_APP_ID || '1703467634308919';
  const redirectUri = process.env.META_REDIRECT_URI || 'https://myagent.adwiselabs.com/api/instagram/callback';
  // We can pass the customerId in the state parameter
  const state = encodeURIComponent(customerId);
  const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights';

  const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;

  res.json({ url: authUrl });
});

// Callback route where Meta redirects after successful login
router.get('/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;

  if (error) {
    console.error('Instagram OAuth Error:', error, error_reason, error_description);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=instagram_auth_failed`);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state parameter');
  }

  const customerId = decodeURIComponent(state);

  try {
    const clientId = process.env.META_APP_ID || '1703467634308919';
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI || 'https://myagent.adwiselabs.com/api/instagram/callback';

    // 1. Exchange code for short-lived access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    let longLivedToken = shortLivedToken;

    // 2. Optionally exchange for a long-lived token (Graph API)
    try {
      const longLivedResponse = await axios.get(`https://graph.instagram.com/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortLivedToken
        }
      });
      longLivedToken = longLivedResponse.data.access_token;
    } catch (longLivedErr) {
      console.warn('Could not exchange for long-lived token, using short-lived:', longLivedErr.message);
    }

    // 3. Save to database
    const customer = await Customer.findOne({ where: { whatsAppNumber: customerId } });
    if (customer) {
      customer.instagramAccessToken = longLivedToken;
      customer.instagramAccountId = userId;
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
