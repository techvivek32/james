import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../src/lib/mongodb';
import ChatMessage from '../../../src/lib/models/ChatMessage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { userId, groupIds } = req.query;

    if (!userId || !groupIds) {
      return res.status(400).json({ error: 'userId and groupIds are required' });
    }

    const groupIdArray = (groupIds as string).split(',');
    
    // Get unread counts for each group
    const unreadCounts: { [key: string]: number } = {};
    
    for (const groupId of groupIdArray) {
      // Count messages where user hasn't read them yet
      // For now, we'll count all messages as a simple implementation
      // In a full implementation, you'd track read receipts per user
      const count = await ChatMessage.countDocuments({
        groupId,
        senderId: { $ne: userId } // Don't count user's own messages
      });
      
      unreadCounts[groupId] = count;
    }

    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
}
