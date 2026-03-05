import mongoose from 'mongoose';

export interface IAppTool {
  _id?: string;
  title: string;
  imageUrl: string;
  description: string;
  link: string;
  webLink?: string;
  appStoreLink?: string;
  playStoreLink?: string;
  category: 'apps' | 'tools' | 'other';
  createdAt?: Date;
  updatedAt?: Date;
}

const AppToolSchema = new mongoose.Schema<IAppTool>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    webLink: { type: String, default: '' },
    appStoreLink: { type: String, default: '' },
    playStoreLink: { type: String, default: '' },
    category: { type: String, enum: ['apps', 'tools', 'other'], required: true }
  },
  { timestamps: true }
);

export default mongoose.models.AppTool || mongoose.model<IAppTool>('AppTool', AppToolSchema);
