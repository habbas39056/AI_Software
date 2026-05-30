const fs = require('fs');
const path = require('path');

const updateEnv = (updates) => {
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  Object.keys(updates).forEach(key => {
    const value = updates[key];
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    // Update in memory as well
    process.env[key] = value;
  });

  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
};

module.exports = { updateEnv };
