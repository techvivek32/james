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

async function checkReynaTeam() {
  console.log('👥 Checking Reyna\'s Sales Team\n');
  
  try {
    // Get all users
    const users = await fetchData('http://localhost:3000/api/users');
    
    // Find Reyna
    const reyna = users.find(u => u.name === 'Reyna');
    if (!reyna) {
      console.log('❌ Reyna not found');
      return;
    }
    
    console.log(`📋 Manager: ${reyna.name} (ID: ${reyna.id})\n`);
    
    // Find all sales users assigned to Reyna
    const reynaSalesTeam = users.filter(u => 
      u.role === 'sales' && u.managerId === reyna.id
    );
    
    console.log(`👨‍💼 Reyna has ${reynaSalesTeam.length} sales team members:\n`);
    
    reynaSalesTeam.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name}`);
      console.log(`      - ID: ${member.id}`);
      console.log(`      - Email: ${member.email}`);
      console.log(`      - Territory: ${member.territory || 'Not set'}`);
      console.log('');
    });
    
    // Test Reyna's business plans API
    console.log('📊 Testing Reyna\'s Business Plans API:');
    const reynaPlans = await fetchData(`http://localhost:3000/api/business-plan?managerId=${reyna.id}`);
    
    console.log(`   API returned ${reynaPlans.length} plans for Reyna's team:\n`);
    
    reynaPlans.forEach(plan => {
      console.log(`   - ${plan.userName}:`);
      console.log(`     Status: ${plan.businessPlan ? '✅ HAS PLAN' : '❌ NO PLAN'}`);
      if (plan.businessPlan) {
        console.log(`     Revenue Goal: $${plan.businessPlan.revenueGoal?.toLocaleString()}`);
        console.log(`     Days/Week: ${plan.businessPlan.daysPerWeek}`);
        console.log(`     Committed: ${plan.businessPlan.committed ? 'Yes' : 'No'}`);
      }
      console.log('');
    });
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Total Sales Team: ${reynaSalesTeam.length}`);
    console.log(`   Plans Retrieved: ${reynaPlans.length}`);
    console.log(`   With Business Plans: ${reynaPlans.filter(p => p.businessPlan).length}`);
    console.log(`   Without Plans: ${reynaPlans.filter(p => !p.businessPlan).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkReynaTeam();