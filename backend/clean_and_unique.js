const sequelize = require('./config/db');

async function enforceUniqueLeads() {
  try {
    console.log('1. Cleaning up duplicate leads...');
    // Delete duplicates, keeping only the one with the highest ID (latest)
    // Note: This MySQL query safely deletes duplicate phone+customer combinations
    await sequelize.query(`
      DELETE t1 FROM Leads t1
      INNER JOIN Leads t2 
      WHERE 
        t1.Id < t2.Id AND 
        t1.PhoneNumber = t2.PhoneNumber AND 
        t1.CustomerId = t2.CustomerId;
    `);
    console.log('Duplicates removed.');

    console.log('2. Adding UNIQUE constraint to database...');
    // Try to drop it first in case it already exists
    try {
      await sequelize.query(`ALTER TABLE Leads DROP INDEX unique_phone_customer`);
    } catch (e) {
      // Ignore if it doesn't exist
    }

    // Add the unique index
    await sequelize.query(`
      ALTER TABLE Leads 
      ADD UNIQUE INDEX unique_phone_customer (PhoneNumber, CustomerId);
    `);
    
    console.log('UNIQUE constraint successfully added!');
    console.log('From now on, the database will strictly REJECT any duplicate leads for the same phone number.');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

enforceUniqueLeads();
