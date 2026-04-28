import type { NextApiRequest, NextApiResponse } from 'next';
import { connectMongo } from '../../../../src/lib/mongodb';
import ChatMessage from '../../../../src/lib/models/ChatMessage';
import ChatGroup from '../../../../src/lib/models/ChatGroup';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  const { groupId } = req.query;

  if (req.method === 'GET') {
    // Get messages for a group
    try {
      const { userId, userRole } = req.query;
      
      // Check if group exists
      const group = await ChatGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Allow access if user is admin, group admin, or member
      const isAdmin = userRole === 'admin';
      const isGroupAdmin = group.admins.includes(userId as string);
      const isMember = group.members.includes(userId as string);
      
      if (!isAdmin && !isGroupAdmin && !isMember) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }

      const messages = await ChatMessage.find({ groupId })
        .sort({ createdAt: 1 })
        .limit(500); // Last 500 messages

      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else if (req.method === 'POST') {
    // Send a message
    try {
      const { senderId, senderName, senderRole, message, messageType, mediaUrl, replyTo, replyToMessage, replyToSender } = req.body;

      if (!senderId || !senderName) {
        return res.status(400).json({ error: 'Sender information is required' });
      }

      // Check if group exists
      const group = await ChatGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if user is a member or admin
      if (!group.members.includes(senderId)) {
        // Allow if user is admin
        if (senderRole !== 'admin') {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
      }

      // Check if only admin can chat
      if (group.onlyAdminCanChat) {
        // Check if sender is admin or group admin
        const isAdmin = senderRole === 'admin';
        const isGroupAdmin = group.admins.includes(senderId);
        
        if (!isAdmin && !isGroupAdmin) {
          return res.status(403).json({ error: 'Only admins can send messages in this group' });
        }
      }

      // Extract mentions from message text
      const mentionedUserIds: string[] = [];
      if (message && messageType === 'text') {
        // Import User model
        const { UserModel } = await import('../../../../src/lib/models/User');
        
        // Get all group members
        const groupMembers = await UserModel.find({
          _id: { $in: group.members }
        }).select('_id name');
        
        // For each member, check if their name is mentioned with @
        for (const member of groupMembers) {
          const memberName = member.name;
          // Create regex to match @Name (case insensitive, with word boundary or space after)
          const nameRegex = new RegExp(`@${memberName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'i');
          if (nameRegex.test(message)) {
            mentionedUserIds.push(member._id.toString());
          }
        }
      }

      // Create message with reply fields if provided
      const messageData: any = {
        groupId,
        senderId,
        senderName,
        senderRole,
        message: message || '',
        messageType: messageType || 'text',
        mediaUrl: mediaUrl || '',
        mentions: mentionedUserIds
      };

      // Add reply fields if they exist
      if (replyTo) {
        messageData.replyTo = replyTo;
        messageData.replyToMessage = replyToMessage || '';
        messageData.replyToSender = replyToSender || '';
      }

      const newMessage = await ChatMessage.create(messageData);

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
