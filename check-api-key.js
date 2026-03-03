const fs = require('fs');
const https = require('https');

// Read API key from .env file
function getApiKey() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/OPENAI_API_KEY=(.+)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    return null;
  }
}

// Test API key validity
function testApiKey(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ valid: true, status: res.statusCode });
        } else {
          const errorData = JSON.parse(responseData);
          resolve({ 
            valid: false, 
            status: res.statusCode, 
            error: errorData.error?.message || 'Unknown error' 
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main function
async function validateApiKey() {
  console.log('🔍 Checking OpenAI API Key...\n');
  
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.log('❌ No API key found in .env file');
    return;
  }
  
  if (apiKey === 'your_new_api_key_here') {
    console.log('❌ Please replace placeholder with actual API key');
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    const result = await testApiKey(apiKey);
    
    if (result.valid) {
      console.log('✅ API Key is VALID');
      console.log('🎉 OpenAI API is working correctly!');
    } else {
      console.log('❌ API Key is INVALID');
      console.log(`📝 Status: ${result.status}`);
      console.log(`📝 Error: ${result.error}`);
      console.log('\n💡 Get a new API key at: https://platform.openai.com/account/api-keys');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

validateApiKey();