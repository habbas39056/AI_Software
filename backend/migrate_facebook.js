const sequelize = require('./config/db');

async function migrate() {
  console.log('Starting Facebook field migration...');
  try {
    console.log('Adding columns to Agents table...');
    await sequelize.query(`
      ALTER TABLE Agents 
      ADD COLUMN FacebookAccessToken VARCHAR(500) NULL DEFAULT NULL,
      ADD COLUMN FacebookPageId VARCHAR(255) NULL DEFAULT NULL;
    `).catch(err => {
      console.warn('  -> Note (Agents columns):', err.message);
    });

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
