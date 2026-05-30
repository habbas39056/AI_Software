const axios = require('axios');

// Read from process.env inside functions to ensure they are always up to date
const getEvolutionConfig = () => ({
  url: process.env.EVOLUTION_API_URL,
  key: process.env.EVOLUTION_API_KEY
});

exports.getQRCode = async (req, res) => {
  const { instanceName } = req.params;
  const { url: EVOLUTION_API_URL, key: EVOLUTION_API_KEY } = getEvolutionConfig();
  
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error('Evolution Config Missing:', { EVOLUTION_API_URL, EVOLUTION_API_KEY });
    return res.status(500).json({ error: 'System configuration error: Evolution API credentials missing.' });
  }

  try {
    // 1. Try to create instance first (in case it doesn't exist)
    try {
      await axios.post(`${EVOLUTION_API_URL}/instance/create`, {
        instanceName: instanceName,
        token: instanceName,
        qrcode: true
      }, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      });
      console.log(`Instance ${instanceName} created.`);
    } catch (err) {
      // If error is "already exists" (usually 403 or 400), we just continue
      console.log(`Instance ${instanceName} might already exist, continuing...`);
    }

    // 2. Now try to connect and get QR
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    
    if (response.data && response.data.base64) {
      res.json({ base64: response.data.base64 });
    } else if (response.data && response.data.code) {
      // Some versions return 'code' instead of 'base64'
      res.json({ base64: response.data.code });
    } else {
      res.status(400).json({ error: 'Unexpected response from Evolution API' });
    }
  } catch (error) {
    console.error('Evolution API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to connect to Evolution API.' });
  }
};

exports.getPairingCode = async (req, res) => {
  const { instanceName } = req.params;
  const { number } = req.query;
  const { url: EVOLUTION_API_URL, key: EVOLUTION_API_KEY } = getEvolutionConfig();
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}?number=${number}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pairing code.' });
  }
};

exports.getInstanceStatus = async (req, res) => {
  const { instanceName } = req.params;
  const { url: EVOLUTION_API_URL, key: EVOLUTION_API_KEY } = getEvolutionConfig();
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Evolution API Status Error for ${instanceName}:`, error.response?.data || error.message);
    res.json({ instance: { state: 'unknown' } });
  }
};

exports.logoutInstance = async (req, res) => {
  const { instanceName } = req.params;
  const { url: EVOLUTION_API_URL, key: EVOLUTION_API_KEY } = getEvolutionConfig();
  try {
    const response = await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout instance.' });
  }
};
