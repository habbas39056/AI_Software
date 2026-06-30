const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const leadsRoutes = require('./routes/leadsRoutes');
const evolutionRoutes = require('./routes/evolutionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const instructionRoutes = require('./routes/instructionRoutes');
const externalModulesRoutes = require('./routes/externalModulesRoutes');
const instagramRoutes = require('./routes/instagramRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/instructions', instructionRoutes);
app.use('/api/external', externalModulesRoutes);
app.use('/api/instagram', instagramRoutes);

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Public Agent Status Check (for n8n / external services) ──
// n8n can call GET /api/agent-status/:instanceName before sending a reply.
// Returns { active: true/false }
const { Agent } = require('./models');

function isAgentScheduledOn(agent) {
  if (!agent.scheduleEnabled) return true;
  if (!agent.scheduleStartTime || !agent.scheduleEndTime) return true;
  
  try {
    const tz = agent.timezone || 'UTC';
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: tz, 
      hour: '2-digit', 
      minute: '2-digit', 
      hourCycle: 'h23' 
    });
    const currentTime = formatter.format(new Date()); 
    
    const start = agent.scheduleStartTime;
    const end = agent.scheduleEndTime;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  } catch (e) {
    console.error('Error calculating schedule:', e);
    return true; 
  }
}

app.get('/api/agent-status/:instanceName', async (req, res) => {
  try {
    const agent = await Agent.findOne({ where: { instanceName: req.params.instanceName } });
    if (!agent) return res.json({ active: false, reason: 'Agent not found' });
    
    if (!agent.isActive) return res.json({ active: false, reason: 'Agent is manually paused' });
    if (!isAgentScheduledOn(agent)) return res.json({ active: false, reason: 'Outside of scheduled hours' });
    
    res.json({ active: true });
  } catch (error) {
    console.error('Agent status check error:', error);
    res.json({ active: false, reason: 'Error checking status' });
  }
});

// ── Webhook Proxy (intercepts WhatsApp messages → forwards to n8n only if agent is active) ──
// Configure Evolution API to send webhooks to: POST /api/webhook-proxy/:instanceName
const { Customer } = require('./models');
const axios = require('axios');

app.post('/api/webhook-proxy/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  try {
    // 1. Find the agent by instance name
    const agent = await Agent.findOne({ where: { instanceName } });
    if (!agent) {
      console.log(`[Webhook Proxy] No agent found for instance: ${instanceName}`);
      return res.status(200).json({ status: 'ignored', reason: 'Agent not found' });
    }

    // 2. Check if agent is active (not paused)
    if (!agent.isActive) {
      console.log(`[Webhook Proxy] Agent "${instanceName}" is PAUSED — message NOT forwarded.`);
      return res.status(200).json({ status: 'paused', reason: 'Agent is paused' });
    }

    if (!isAgentScheduledOn(agent)) {
      console.log(`[Webhook Proxy] Agent "${instanceName}" is OUTSIDE SCHEDULED HOURS — message NOT forwarded.`);
      return res.status(200).json({ status: 'paused', reason: 'Outside of scheduled hours' });
    }

    // 3. Find the customer's n8n webhook URL
    const customer = await Customer.findOne({ where: { whatsAppNumber: agent.customerId } });
    if (!customer || !customer.n8nWebhookUrl) {
      console.log(`[Webhook Proxy] No webhook URL configured for customer: ${agent.customerId}`);
      return res.status(200).json({ status: 'ignored', reason: 'No webhook URL configured' });
    }

    // 4. Forward the full payload to n8n
    console.log(`[Webhook Proxy] Agent "${instanceName}" is ACTIVE — forwarding to n8n...`);
    await axios.post(customer.n8nWebhookUrl, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    res.status(200).json({ status: 'forwarded' });
  } catch (error) {
    console.error(`[Webhook Proxy] Error:`, error.message);
    res.status(200).json({ status: 'error', reason: error.message });
  }
});

// Serve Static Files (Production)
app.use(express.static(path.join(__dirname, '../ClientApp/dist')));

// SPA Fallback (Redirect all other routes to index.html)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../ClientApp/dist/index.html'));
});

// Start Server, then sync Database
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

sequelize.sync().then(async () => {
  console.log('Database synced successfully');
  
  // Create a MySQL trigger to automatically increment MessageCount whenever Summary changes.
  // This ensures the count increases even if N8N updates the DB directly bypassing the API.
  try {
    await sequelize.query('DROP TRIGGER IF EXISTS before_lead_summary_update;');
    await sequelize.query(`
      CREATE TRIGGER before_lead_summary_update 
      BEFORE UPDATE ON Leads 
      FOR EACH ROW 
      BEGIN 
        IF NEW.Summary != OLD.Summary OR (NEW.Summary IS NOT NULL AND OLD.Summary IS NULL) THEN 
          SET NEW.MessageCount = IFNULL(OLD.MessageCount, 1) + 1; 
        END IF; 
      END;
    `);
    console.log('Summary tracking trigger applied successfully.');
  } catch (err) {
    console.log('Note: Could not create DB trigger (might not be supported in this SQL dialect):', err.message);
  }
}).catch(err => {
  console.error('Failed to sync database:', err.message);
});
