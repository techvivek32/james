import type { NextApiRequest, NextApiResponse } from 'next';
import { connectMongo } from '../../src/lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, businessPlan } = req.body;

    console.log('💾 Saving business plan:', { userId, businessPlan });

    try {
      await connectMongo();
      const db = mongoose.connection.db;
      
      const result = await db.collection('businessPlans').updateOne(
        { userId },
        { 
          $set: { 
            userId,
            businessPlan,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      console.log('✅ Save result:', result);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Business plan save error:', error);
      
      // Fallback: Save to file system for testing
      const fs = require('fs');
      const path = require('path');
      
      try {
        const plansFile = path.join(process.cwd(), 'saved-business-plans.json');
        let existingPlans = [];
        
        if (fs.existsSync(plansFile)) {
          existingPlans = JSON.parse(fs.readFileSync(plansFile, 'utf8'));
        }
        
        // Update or add plan
        const planIndex = existingPlans.findIndex(p => p.userId === userId);
        const planData = { userId, businessPlan, updatedAt: new Date() };
        
        if (planIndex >= 0) {
          existingPlans[planIndex] = planData;
        } else {
          existingPlans.push(planData);
        }
        
        fs.writeFileSync(plansFile, JSON.stringify(existingPlans, null, 2));
        console.log('✅ Saved to file system as fallback');
        
        res.status(200).json({ success: true });
      } catch (fileError) {
        console.error('❌ File save error:', fileError);
        res.status(500).json({ error: 'Failed to save business plan' });
      }
    }
  } else if (req.method === 'GET') {
    const { managerId } = req.query;
    
    try {
      // Get users from existing API
      const usersResponse = await fetch('http://localhost:3000/api/users');
      const users = await usersResponse.json();
      
      console.log('All users:', users.map(u => ({ name: u.name, id: u.id, role: u.role, managerId: u.managerId })));
      
      // Filter sales users by manager
      const salesUsers = users.filter(user => 
        user.role === 'sales' && 
        (managerId ? user.managerId === managerId : true)
      );
      
      console.log('Filtered sales users:', salesUsers.map(u => ({ name: u.name, id: u.id, managerId: u.managerId })));
      
      // Try to load saved plans from file system
      const fs = require('fs');
      const path = require('path');
      const plansFile = path.join(process.cwd(), 'saved-business-plans.json');
      
      let savedPlans = [];
      if (fs.existsSync(plansFile)) {
        try {
          savedPlans = JSON.parse(fs.readFileSync(plansFile, 'utf8'));
          console.log('Loaded saved plans from file:', savedPlans.length);
        } catch (fileError) {
          console.log('Error reading saved plans file:', fileError.message);
        }
      }
      
      // Combine saved plans with mock data
      const allBusinessPlans = [
        {
          userId: 'sales-1',
          businessPlan: {
            revenueGoal: 400000,
            daysPerWeek: 5,
            dealsPerYear: 34,
            dealsPerMonth: 3,
            inspectionsNeeded: 85,
            doorsPerYear: 1063,
            committed: true
          }
        },
        ...savedPlans
      ];
      
      // Combine user data with business plans
      const plansWithUsers = salesUsers.map(user => {
        const plan = allBusinessPlans.find(p => p.userId === user.id);
        return {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          managerId: user.managerId,
          businessPlan: plan?.businessPlan || null,
          updatedAt: plan ? new Date() : null
        };
      });
      
      console.log('Final result:', plansWithUsers);
      res.status(200).json(plansWithUsers);
    } catch (error) {
      console.error('Business plans fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch business plans: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end();
  }
}