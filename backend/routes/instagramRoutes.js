const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Customer, Agent } = require('../models');

// Initiates the Facebook OAuth flow for Instagram Business
// Expects agentId (or customerId for fallback) to track which agent is connecting
router.get('/auth', (req, res) => {
  const { agentId, customerId } = req.query;
  
  if (!agentId && !customerId) {
    return res.status(400).json({ error: 'agentId or customerId is required' });
  }

  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'META_APP_ID and META_REDIRECT_URI must be configured in .env' });
  }

  // Pass the agentId (or customerId fallback) in the state parameter
  const stateVal = agentId || customerId;
  const state = encodeURIComponent(stateVal);
  
  // Scopes required for Instagram Graph API
  const scope = 'instagram_basic,instagram_manage_comments,instagram_manage_insights,instagram_content_publish,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata';

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

  const stateVal = decodeURIComponent(state);

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
    let agent = null;
    if (!isNaN(stateVal)) {
      // It's a numeric agentId
      agent = await Agent.findByPk(parseInt(stateVal));
    } else {
      // Fallback: it's a customerId (whatsAppNumber), find their first agent
      agent = await Agent.findOne({ where: { customerId: stateVal } });
    }

    if (agent) {
      agent.instagramAccessToken = longLivedToken;
      if (fbUserId) {
        agent.instagramAccountId = fbUserId;
      }
      await agent.save();
      console.log(`Instagram connected for agent ID: ${agent.id}`);

      // Automatically subscribe Page(s) to the Webhook App
      try {
        console.log('Fetching Facebook Pages to subscribe to webhooks...');
        const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
          params: { access_token: longLivedToken }
        });

        const pages = pagesResponse.data.data || [];
        console.log(`Found ${pages.length} Facebook Pages for agent ID: ${agent.id}`);

        for (const page of pages) {
          try {
            console.log(`Subscribing page "${page.name}" (ID: ${page.id}) to webhooks...`);
            const subResponse = await axios.post(
              `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`,
              null,
              {
                params: {
                  subscribed_fields: 'messages,messaging_postbacks,message_reactions,comments',
                  access_token: page.access_token
                }
              }
            );
            console.log(`Successfully subscribed page "${page.name}":`, subResponse.data);
          } catch (subErr) {
            console.error(
              `Failed to subscribe page "${page.name}" (ID: ${page.id}):`,
              subErr.response?.data || subErr.message
            );
          }
        }
      } catch (pagesErr) {
        console.error(
          'Failed to retrieve Facebook Pages for webhook subscription:',
          pagesErr.response?.data || pagesErr.message
        );
      }
    } else {
      console.error('Agent not found for Instagram auth callback state:', stateVal);
    }

    // 4. Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?success=instagram_connected`);

  } catch (err) {
    console.error('Instagram Token Exchange Error:', err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=instagram_token_exchange_failed`);
  }
});

module.exports = router;
