const sequelize = require('./config/db');
const { Lead } = require('./models');

async function testUpdate() {
  try {
    const leads = await Lead.findAll();
    console.log(`Found ${leads.length} total leads in DB.`);
    if (leads.length > 0) {
      const first = leads[0];
      console.log('Sample Lead: ID:', first.id, 'PhoneNumber:', `"${first.phoneNumber}"`, 'Length:', first.phoneNumber ? first.phoneNumber.length : 0);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testUpdate();
