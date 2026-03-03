const http = require('http');

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testManagerSalesRelationship() {
  console.log('🔍 Testing Manager-Sales Relationship & Business Plans\n');
  
  try {
    // 1. Fetch all users
    console.log('1️⃣ Fetching all users...');
    const users = await fetchData('http://localhost:3000/api/users');
    console.log(`   Found ${users.length} users\n`);
    
    // 2. Show managers
    const managers = users.filter(u => u.role === 'manager');
    console.log('2️⃣ Managers:');
    managers.forEach(m => {
      console.log(`   - ${m.name} (ID: ${m.id})`);
    });
    console.log('');
    
    // 3. Show sales users and their managers
    const salesUsers = users.filter(u => u.role === 'sales');
    console.log('3️⃣ Sales Users:');
    salesUsers.forEach(s => {
      const manager = users.find(u => u.id === s.managerId);
      console.log(`   - ${s.name} (ID: ${s.id}) → Manager: ${manager ? manager.name : 'NONE'} (${s.managerId || 'NO MANAGER ID'})`);
    });
    console.log('');
    
    // 4. Test business plans API for each manager
    console.log('4️⃣ Testing Business Plans API:');
    for (const manager of managers) {
      console.log(`\n   📋 Manager: ${manager.name} (${manager.id})`);
      try {
        const plans = await fetchData(`http://localhost:3000/api/business-plan?managerId=${manager.id}`);
        console.log(`   ✅ API Response: ${plans.length} plans found`);
        
        plans.forEach(plan => {
          console.log(`      - ${plan.userName}: ${plan.businessPlan ? '✅ HAS PLAN' : '❌ NO PLAN'}`);
        });
      } catch (error) {
        console.log(`   ❌ API Error: ${error.message}`);
      }
    }
    
    // 5. Test without manager filter
    console.log('\n5️⃣ Testing All Business Plans (no filter):');
    try {
      const allPlans = await fetchData('http://localhost:3000/api/business-plan');
      console.log(`   ✅ Found ${allPlans.length} total plans`);
      allPlans.forEach(plan => {
        console.log(`      - ${plan.userName} (${plan.userRole}): ${plan.businessPlan ? '✅ HAS PLAN' : '❌ NO PLAN'}`);
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Script Error:', error.message);
  }
}

testManagerSalesRelationship();