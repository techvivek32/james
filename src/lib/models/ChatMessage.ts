import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  replyTo?: string;
  replyToMessage?: string;
  replyToSender?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    groupId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file'],
      default: 'text'
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    replyTo: {
      type: String,
      default: ''
    },
    replyToMessage: {
      type: String,
      default: ''
    },
    replyToSender: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ChatMessageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
