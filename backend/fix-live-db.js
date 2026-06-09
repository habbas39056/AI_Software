const sequelize = require('./config/db');

async function fixLiveDb() {
  console.log('Connecting to database to apply schema patches...');
  try {
    // Attempt to add new columns to Customers table manually
    // We catch individual errors in case the column already exists
    console.log('Adding ModuleComplains column...');
    await sequelize.query("ALTER TABLE Customers ADD COLUMN ModuleComplains TINYINT(1) DEFAULT 0;").catch(e => console.log('  -> Note:', e.message));
    
    console.log('Adding ModuleInstruction column...');
    await sequelize.query("ALTER TABLE Customers ADD COLUMN ModuleInstruction TINYINT(1) DEFAULT 0;").catch(e => console.log('  -> Note:', e.message));
    
    console.log('Adding ModuleComplainsFields column...');
    await sequelize.query("ALTER TABLE Customers ADD COLUMN ModuleComplainsFields TEXT;").catch(e => console.log('  -> Note:', e.message));
    
    console.log('Adding ModuleInstructionFields column...');
    await sequelize.query("ALTER TABLE Customers ADD COLUMN ModuleInstructionFields TEXT;").catch(e => console.log('  -> Note:', e.message));

    // Ensure new tables are created
    console.log('Syncing ExternalComplaint table...');
    const ExternalComplaint = require('./models/ExternalComplaint');
    await ExternalComplaint.sync();

    console.log('Syncing ExternalInstruction table...');
    const ExternalInstruction = require('./models/ExternalInstruction');
    await ExternalInstruction.sync();

    console.log('\n✅ Database patched successfully. The live server should no longer throw 500 errors.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error patching database:', error);
    process.exit(1);
  }
}

fixLiveDb();
