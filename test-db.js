require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

console.log('--- Database Connection Test ---');
console.log('Attempting to connect to cluster...');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE: Could not connect to MongoDB Atlas');
    console.error('Error Details:', err.message);
    
    if (err.message.includes('timeout') || err.message.includes('ETIMEOUT')) {
      console.log('\n💡 Possible Causes:');
      console.log('1. IP Whitelisting: Is your current IP allowed in MongoDB Atlas? (Check Network Access)');
      console.log('2. Network/Firewall: Are you behind a corporate firewall or VPN blocking MongoDB ports?');
    } else if (err.message.includes('auth failed') || err.message.includes('bad auth')) {
      console.log('\n💡 Possible Causes:');
      console.log('1. Invalid Credentials: User or Password in MONGO_URI is wrong.');
      console.log('2. Special Characters: If your password has @, :, /, or $, it must be URL encoded.');
    }
    
    process.exit(1);
  });
