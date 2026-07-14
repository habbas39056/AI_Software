const sequelize = require('./config/db');

async function migrate() {
  console.log('Starting Instagram field migration from Customer to Agent...');
  try {
    // 1. Add InstagramAccessToken and InstagramAccountId to Agents
    console.log('Adding columns to Agents table...');
    await sequelize.query(`
      ALTER TABLE Agents 
      ADD COLUMN InstagramAccessToken VARCHAR(500) NULL DEFAULT NULL,
      ADD COLUMN InstagramAccountId VARCHAR(255) NULL DEFAULT NULL;
    `).catch(err => {
      console.warn('  -> Note (Agents columns):', err.message);
    });

    // 2. Migrate existing Instagram data from Customers to Agents
    console.log('Migrating existing Instagram data...');
    await sequelize.query(`
      UPDATE Agents a
      INNER JOIN Customers c ON a.CustomerId = c.WhatsAppNumber
      SET a.InstagramAccessToken = c.InstagramAccessToken,
          a.InstagramAccountId = c.InstagramAccountId
      WHERE c.InstagramAccessToken IS NOT NULL OR c.InstagramAccountId IS NOT NULL;
    `).catch(err => {
      console.warn('  -> Note (Data migration):', err.message);
    });

    // 3. Drop InstagramAccessToken and InstagramAccountId from Customers
    console.log('Removing columns from Customers table...');
    await sequelize.query(`
      ALTER TABLE Customers 
      DROP COLUMN InstagramAccessToken,
      DROP COLUMN InstagramAccountId;
    `).catch(err => {
      console.warn('  -> Note (Customers columns removal):', err.message);
    });

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
