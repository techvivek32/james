import type { NextApiRequest, NextApiResponse } from 'next';
import { connectMongo } from '../../../src/lib/mongodb';
import AppTool from '../../../src/lib/models/AppTool';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === 'GET') {
    try {
      const appTools = await AppTool.find({}).sort({ createdAt: -1 });
      return res.status(200).json(appTools);
    } catch (error) {
      console.error('Error fetching apps/tools:', error);
      return res.status(500).json({ error: 'Failed to fetch apps/tools' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, imageUrl, description, link, webLink, appStoreLink, playStoreLink, category } = req.body;

      if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required' });
      }

      const appTool = await AppTool.create({
        title,
        imageUrl: imageUrl || '',
        description: description || '',
        link: link || '',
        webLink: webLink || '',
        appStoreLink: appStoreLink || '',
        playStoreLink: playStoreLink || '',
        category
      });

      return res.status(201).json(appTool);
    } catch (error) {
      console.error('Error creating app/tool:', error);
      return res.status(500).json({ error: 'Failed to create app/tool' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
