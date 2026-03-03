const http = require('http');

async function fetchData(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Business Plan Workflow\n');
  
  try {
    // 1. Test saving a business plan
    console.log('1️⃣ Testing Business Plan Save...');
    const testPlan = {
      userId: 'sales-1',
      businessPlan: {
        revenueGoal: 600000,
        daysPerWeek: 6,
        territories: ['Test City'],
        averageDealSize: 15000,
        dealsPerYear: 40,
        dealsPerMonth: 3,
        inspectionsNeeded: 100,
        doorsPerYear: 1250,
        doorsPerDay: 5,
        committed: true
      }
    };
    
    const saveResult = await fetchData('http://localhost:3000/api/business-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPlan)
    });
    
    console.log(`   Save Status: ${saveResult.status}`);
    console.log(`   Save Response: ${JSON.stringify(saveResult.data)}\n`);
    
    // 2. Test retrieving all plans
    console.log('2️⃣ Testing All Business Plans Retrieval...');
    const allPlansResult = await fetchData('http://localhost:3000/api/business-plan');
    console.log(`   Status: ${allPlansResult.status}`);
    console.log(`   Found ${allPlansResult.data.length} plans:`);
    
    allPlansResult.data.forEach(plan => {
      console.log(`      - ${plan.userName}: ${plan.businessPlan ? '✅ HAS PLAN' : '❌ NO PLAN'}`);
      if (plan.businessPlan) {
        console.log(`        Revenue: $${plan.businessPlan.revenueGoal?.toLocaleString()}`);
        console.log(`        Days/Week: ${plan.businessPlan.daysPerWeek}`);
        console.log(`        Committed: ${plan.businessPlan.committed ? 'Yes' : 'No'}`);
      }
    });
    console.log('');
    
    // 3. Test manager-specific filtering
    console.log('3️⃣ Testing Manager-Specific Filtering...');
    const managerPlansResult = await fetchData('http://localhost:3000/api/business-plan?managerId=manager-1');
    console.log(`   Status: ${managerPlansResult.status}`);
    console.log(`   Manager-1 team plans: ${managerPlansResult.data.length}`);
    
    managerPlansResult.data.forEach(plan => {
      console.log(`      - ${plan.userName} (Manager: ${plan.managerId}): ${plan.businessPlan ? '✅ HAS PLAN' : '❌ NO PLAN'}`);
    });
    console.log('');
    
    // 4. Check saved file
    console.log('4️⃣ Checking Saved File...');
    const fs = require('fs');
    const path = require('path');
    const plansFile = path.join(process.cwd(), 'saved-business-plans.json');
    
    if (fs.existsSync(plansFile)) {
      const fileContent = JSON.parse(fs.readFileSync(plansFile, 'utf8'));
      console.log(`   File contains ${fileContent.length} saved plans:`);
      fileContent.forEach((plan, index) => {
        console.log(`      Plan ${index + 1}: User ${plan.userId}, Revenue $${plan.businessPlan.revenueGoal?.toLocaleString()}`);
      });
    } else {
      console.log('   ❌ No saved plans file found');
    }
    console.log('');
    
    // 5. Summary
    console.log('📊 WORKFLOW TEST SUMMARY:');
    console.log(`   ✅ Save API: ${saveResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Retrieve API: ${allPlansResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Manager Filter: ${managerPlansResult.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ File Backup: ${fs.existsSync(plansFile) ? 'WORKING' : 'FAILED'}`);
    
    const workingCount = [
      saveResult.status === 200,
      allPlansResult.status === 200,
      managerPlansResult.status === 200,
      fs.existsSync(plansFile)
    ].filter(Boolean).length;
    
    console.log(`\n🎯 Overall Status: ${workingCount}/4 components working`);
    
    if (workingCount === 4) {
      console.log('🎉 ALL SYSTEMS WORKING! Business plan workflow is fully functional.');
    } else {
      console.log('⚠️  Some components need attention.');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testCompleteWorkflow();