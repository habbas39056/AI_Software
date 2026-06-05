const sequelize = require('./config/db');

async function fix() {
  try {
    console.log('Adding MessageCount column...');
    await sequelize.query(`ALTER TABLE Leads ADD COLUMN MessageCount INT DEFAULT 1`);
    console.log('Column added successfully.');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('Column already exists.');
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
}

fix();
