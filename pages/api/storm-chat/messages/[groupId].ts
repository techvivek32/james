import type { NextApiRequest, NextApiResponse } from 'next';
import { connectMongo } from '../../../../src/lib/mongodb';
import ChatMessage from '../../../../src/lib/models/ChatMessage';
import ChatGroup from '../../../../src/lib/models/ChatGroup';
import { NotificationModel } from '../../../../src/lib/models/Notification';
import fetch from 'node-fetch';

// Replace with your OneSignal App ID and REST API Key
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID';
const ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY || 'YOUR_ONESIGNAL_REST_API_KEY';

async function sendOneSignalNotification(
  title: string,
  message: string,
  data?: any
) {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: title },
        included_segments: ['Subscribed Users'], // For testing - later you can target specific users
        data: data,
      }),
    });
    
    const result = await response.json();
    console.log('OneSignal notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    return null;
  }
}

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

      // Create notifications for group members
      const notificationPromises: Promise<any>[] = [];

      // 1. Mention notifications
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId !== senderId) {
          notificationPromises.push(
            NotificationModel.create({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: mentionedUserId,
              type: 'stormchat_mention',
              title: `You were mentioned by ${senderName}`,
              message: messageType === 'text' 
                ? (message?.substring(0, 100) || 'New message')
                : (messageType === 'image' ? 'Shared an image' : 'New message'),
              read: false,
              metadata: {
                groupId,
                groupName: group.name,
                messageId: newMessage._id
              }
            })
          );
        }
      }

      // 2. New message notifications for other members
      for (const memberId of group.members) {
        if (memberId !== senderId && !mentionedUserIds.includes(memberId)) {
          notificationPromises.push(
            NotificationModel.create({
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: memberId,
              type: 'stormchat_message',
              title: `New message in ${group.name}`,
              message: `${senderName}: ${
                messageType === 'text' 
                  ? (message?.substring(0, 100) || 'New message')
                  : (messageType === 'image' ? 'Shared an image' : 'New message')
              }`,
              read: false,
              metadata: {
                groupId,
                groupName: group.name,
                messageId: newMessage._id
              }
            })
          );
        }
      }

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      // Send OneSignal push notifications (for testing - sends to all subscribed users)
      // Later you can target specific users using OneSignal External User IDs
      await sendOneSignalNotification(
        mentionedUserIds.length > 0 
          ? `You were mentioned in ${group.name}` 
          : `New message in ${group.name}`,
        `${senderName}: ${messageType === 'text' ? (message?.substring(0, 100) || 'New message') : (messageType === 'image' ? 'Shared an image' : 'New message')}`,
        {
          type: 'stormchat',
          groupId: groupId,
          groupName: group.name,
        }
      );

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
